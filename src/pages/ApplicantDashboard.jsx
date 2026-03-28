import { useState, useRef, useEffect } from "react";
import "./ApplicantDashboard.css";
import Navbar from "../components/Navbar.jsx";
import Starfield from "../components/Starfield.jsx";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import * as pdfjsLib from "pdfjs-dist";
import { apiUrl } from "../config/api";

function trimCanvasWhitespace(sourceCanvas) {
  const context = sourceCanvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return sourceCanvas;
  }

  const { width, height } = sourceCanvas;
  const { data } = context.getImageData(0, 0, width, height);
  const alphaThreshold = 10;
  const whiteThreshold = 245;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3];

      if (alpha <= alphaThreshold) {
        continue;
      }

      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const isNearWhite =
        red >= whiteThreshold &&
        green >= whiteThreshold &&
        blue >= whiteThreshold;

      if (isNearWhite) {
        continue;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX === -1 || maxY === -1) {
    return sourceCanvas;
  }

  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;
  const removedWidth = width - cropWidth;
  const removedHeight = height - cropHeight;
  const shouldCrop =
    removedWidth > width * 0.18 || removedHeight > height * 0.18;

  if (!shouldCrop) {
    return sourceCanvas;
  }

  const padding = Math.round(Math.min(width, height) * 0.035);
  const startX = Math.max(0, minX - padding);
  const startY = Math.max(0, minY - padding);
  const endX = Math.min(width, maxX + padding);
  const endY = Math.min(height, maxY + padding);
  const finalWidth = Math.max(1, endX - startX);
  const finalHeight = Math.max(1, endY - startY);

  const trimmedCanvas = document.createElement("canvas");
  trimmedCanvas.width = finalWidth;
  trimmedCanvas.height = finalHeight;

  const trimmedContext = trimmedCanvas.getContext("2d");
  if (!trimmedContext) {
    return sourceCanvas;
  }

  trimmedContext.drawImage(
    sourceCanvas,
    startX,
    startY,
    finalWidth,
    finalHeight,
    0,
    0,
    finalWidth,
    finalHeight
  );

  return trimmedCanvas;
}

function getCardSize(canvasWidth, canvasHeight) {
  const maxWidth = 3.9;
  const maxHeight = 4.55;
  const scale = Math.min(maxWidth / canvasWidth, maxHeight / canvasHeight);

  return {
    width: canvasWidth * scale,
    height: canvasHeight * scale,
  };
}

async function renderPDFToCanvas(pdfFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // Use a stable version of pdf.js worker with https
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        const pdf = await pdfjsLib.getDocument({ data: e.target.result }).promise;
        const page = await pdf.getPage(1);
        const renderScale = Math.min(
          5.5,
          Math.max(3.5, (window.devicePixelRatio || 1) * 2.4)
        );

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        const viewport = page.getViewport({ scale: renderScale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        resolve(canvas);
      } catch (error) {
        console.error("Error rendering PDF:", error);
        reject(error);
      }
    };
    reader.readAsArrayBuffer(pdfFile);
  });
}

function ResumeViewer3D({ resume }) {
  const containerRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const cardRef = useRef(null);
  const rotationRef = useRef({ x: 0, y: 0 });
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const animationRef = useRef(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isInitializedRef.current) return;

    const initScene = async () => {
      rotationRef.current = { x: 0, y: 0 };
      mouseRef.current = { x: 0.5, y: 0.5 };

      const width = container.clientWidth;
      const height = container.clientHeight;

      if (width === 0 || height === 0) {
        return;
      }

      isInitializedRef.current = true;

      // Cleanup existing renderer
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement.parentNode === container) {
          container.removeChild(rendererRef.current.domElement);
        }
      }

      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 1000);
      camera.position.set(0, 0.1, 8);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const resourcesToDispose = [];
      let frontTexture = null;
      let cardDimensions = { width: 2.95, height: 4.2 };

      if (resume) {
        try {
          const pdfCanvas = await renderPDFToCanvas(resume);
          const previewCanvas = trimCanvasWhitespace(pdfCanvas);
          cardDimensions = getCardSize(
            previewCanvas.width,
            previewCanvas.height
          );
          frontTexture = new THREE.CanvasTexture(previewCanvas);
          frontTexture.colorSpace = THREE.SRGBColorSpace;
          frontTexture.minFilter = THREE.LinearFilter;
          frontTexture.magFilter = THREE.LinearFilter;
          frontTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
          frontTexture.needsUpdate = true;
          resourcesToDispose.push(frontTexture);
        } catch (error) {
          console.error("Failed to render PDF:", error);
        }
      }

      const geometry = new THREE.BoxGeometry(
        cardDimensions.width,
        cardDimensions.height,
        0.1
      );
      resourcesToDispose.push(geometry);
      camera.position.set(
        0,
        0.08,
        THREE.MathUtils.clamp(
          Math.max(cardDimensions.width, cardDimensions.height) * 1.6 + 1.9,
          5.6,
          8
        )
      );

      const materials = [
        new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          roughness: 0.58,
          metalness: 0.08,
        }),
        new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          roughness: 0.58,
          metalness: 0.08,
        }),
        new THREE.MeshStandardMaterial({
          color: 0x16243d,
          roughness: 0.52,
          metalness: 0.12,
        }),
        new THREE.MeshStandardMaterial({
          color: 0x16243d,
          roughness: 0.52,
          metalness: 0.12,
        }),
        new THREE.MeshStandardMaterial(
          frontTexture
            ? {
                map: frontTexture,
                roughness: 0.94,
                metalness: 0.02,
              }
            : {
                color: 0xffffff,
                roughness: 0.96,
                metalness: 0.02,
                emissive: 0x38bdf8,
                emissiveIntensity: 0.07,
              }
        ),
        new THREE.MeshStandardMaterial({
          color: 0x08111f,
          roughness: 0.7,
          metalness: 0.06,
          emissive: 0x0ea5e9,
          emissiveIntensity: 0.06,
        }),
      ];
      resourcesToDispose.push(...materials);

      const card = new THREE.Mesh(geometry, materials);
      card.castShadow = true;
      card.receiveShadow = true;
      card.position.y = 0.06;
      scene.add(card);
      cardRef.current = card;

      const glowGeometry = new THREE.PlaneGeometry(
        cardDimensions.width * 1.55,
        cardDimensions.height * 1.6
      );
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.065,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.set(0, 0, -0.9);
      scene.add(glow);

      const glowCoreGeometry = new THREE.PlaneGeometry(
        cardDimensions.width * 1.22,
        cardDimensions.height * 1.24
      );
      const glowCoreMaterial = new THREE.MeshBasicMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0.09,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const glowCore = new THREE.Mesh(glowCoreGeometry, glowCoreMaterial);
      glowCore.position.set(0, 0.08, -0.7);
      scene.add(glowCore);
      resourcesToDispose.push(
        glowGeometry,
        glowMaterial,
        glowCoreGeometry,
        glowCoreMaterial
      );

      const ambientLight = new THREE.HemisphereLight(0xe0f2fe, 0x020617, 1.35);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 2.25);
      keyLight.position.set(4, 5, 6);
      keyLight.castShadow = true;
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.3);
      fillLight.position.set(-5, 2, 5);
      scene.add(fillLight);

      const rimLight = new THREE.PointLight(0x67e8f9, 3.2, 20, 2);
      rimLight.position.set(0, 0.3, 5.4);
      scene.add(rimLight);

      const underLight = new THREE.PointLight(0x0ea5e9, 1.8, 14, 2);
      underLight.position.set(0, -3.1, 3.8);
      scene.add(underLight);

      const handlePointerMove = (event) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouseRef.current.x = THREE.MathUtils.clamp(
          (event.clientX - rect.left) / rect.width,
          0,
          1
        );
        mouseRef.current.y = THREE.MathUtils.clamp(
          (event.clientY - rect.top) / rect.height,
          0,
          1
        );
      };

      const handlePointerLeave = () => {
        mouseRef.current = { x: 0.5, y: 0.5 };
      };

      container.addEventListener("pointermove", handlePointerMove);
      container.addEventListener("pointerleave", handlePointerLeave);

      const clock = new THREE.Clock();

      const animate = () => {
        animationRef.current = requestAnimationFrame(animate);

        if (cardRef.current) {
          const elapsed = clock.getElapsedTime();
          const idleX = Math.sin(elapsed * 0.8) * 0.05;
          const idleY = Math.cos(elapsed * 0.65) * 0.08;
          const targetX =
            idleX + (0.5 - mouseRef.current.y) * Math.PI * 0.14;
          const targetY =
            idleY + (mouseRef.current.x - 0.5) * Math.PI * 0.18;

          rotationRef.current.x += (targetX - rotationRef.current.x) * 0.06;
          rotationRef.current.y += (targetY - rotationRef.current.y) * 0.06;

          cardRef.current.rotation.x = rotationRef.current.x;
          cardRef.current.rotation.y = rotationRef.current.y;
          cardRef.current.position.y = 0.06 + Math.sin(elapsed * 0.9) * 0.08;

          glowMaterial.opacity = 0.065 + Math.sin(elapsed * 0.9) * 0.008;
          glowCoreMaterial.opacity =
            0.09 + Math.cos(elapsed * 1.1) * 0.012;
        }

        renderer.render(scene, camera);
      };

      animate();

      const handleResize = () => {
        if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
        const newWidth = containerRef.current.clientWidth;
        const newHeight = containerRef.current.clientHeight;
        if (newWidth > 0 && newHeight > 0) {
          cameraRef.current.aspect = newWidth / newHeight;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newWidth, newHeight);
          rendererRef.current.setPixelRatio(
            Math.min(window.devicePixelRatio || 1, 2)
          );
        }
      };

      window.addEventListener("resize", handleResize);

      container._cleanup = () => {
        window.removeEventListener("resize", handleResize);
        container.removeEventListener("pointermove", handlePointerMove);
        container.removeEventListener("pointerleave", handlePointerLeave);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        cardRef.current = null;
        scene.clear();
        resourcesToDispose.forEach((resource) => {
          if (resource && typeof resource.dispose === "function") {
            resource.dispose();
          }
        });
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
        isInitializedRef.current = false;
      };
    };

    // Small delay to ensure container dimensions are ready
    const timeoutId = setTimeout(initScene, 100);

    return () => {
      clearTimeout(timeoutId);
      if (containerRef.current && containerRef.current._cleanup) {
        containerRef.current._cleanup();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [resume]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        borderRadius: "12px",
        cursor: "grab",
      }}
    />
  );
}

function ApplicantDashboard() {
  const navigate = useNavigate();
  const [showResume3D, setShowResume3D] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Software Tester",
    resume: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleSubmit = async (event) => {
    if (event) {
      event.preventDefault();
    }

    if (!form.name || !form.email || !form.resume) {
      setSubmitStatus({
        type: "error",
        message: "Please fill all required fields",
      });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("phone", form.phone);
    formData.append("role", form.role);
    formData.append("resume", form.resume);

    try {
      const response = await fetch(
        apiUrl("/api/applications/apply"),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setSubmitStatus({
          type: "error",
          message: data.message || "Failed to submit application",
        });
        setIsSubmitting(false);
        return;
      }

      setSubmitStatus({
        type: "success",
        message: "Application submitted successfully! Redirecting...",
      });

      setTimeout(() => {
        navigate("/track");
      }, 2000);

      setForm({
        name: "",
        email: "",
        phone: "",
        role: "Software Tester",
        resume: null,
      });
      setShowResume3D(false);
    } catch (error) {
      console.error(error);
      setSubmitStatus({
        type: "error",
        message: "Server error. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar role="applicant" />

      <div className="applicant-page-enhanced">
        {/* Animated background elements */}
        <div className="animated-bg">
          <Starfield />
          <div className="gradient-sphere sphere-1"></div>
          <div className="gradient-sphere sphere-2"></div>
          <div className="gradient-sphere sphere-3"></div>
          <div className="grid-background"></div>
        </div>

        <div className="applicant-content">
          {/* Left side - 3D Resume Viewer */}
          <div className="resume-3d-container">
            <div className="resume-card-wrapper">
              {!showResume3D ? (
                <div className="resume-placeholder">
                  <div className="placeholder-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <p>Upload your resume to preview</p>
                  <span className="text-xs">PDF files only</span>
                </div>
              ) : (
                <ResumeViewer3D resume={form.resume} />
              )}
            </div>
            <p className="resume-hint">
              {form.resume
                ? "Move across the preview to inspect the resume in 3D."
                : "Upload a PDF to unlock the larger 3D preview."}
            </p>
          </div>

          {/* Right side - Application Form */}
          <div className="apply-card-enhanced">
            <div className="card-header">
              <p className="form-kicker">Quick Apply</p>
              <h1>Apply for Job</h1>
              <p className="subtitle">
                A clean one-screen form for your details, role, and resume.
              </p>
            </div>

            <form className="form-container" onSubmit={handleSubmit}>
              {/* Name Input */}
              <div className="input-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  id="name"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  className="enhanced-input"
                />
              </div>

              {/* Email Input */}
              <div className="input-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  id="email"
                  placeholder="john@example.com"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  className="enhanced-input"
                />
              </div>

              {/* Phone Input */}
              <div className="input-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  className="enhanced-input"
                />
              </div>

              {/* Role Select */}
              <div className="input-group">
                <label htmlFor="role">Position *</label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value })
                  }
                  className="enhanced-select"
                >
                  <option>Software Tester</option>
                  <option>Software Developer</option>
                  <option>Frontend Developer</option>
                  <option>Backend Developer</option>
                  <option>Full Stack Developer</option>
                  <option>QA Engineer</option>
                  <option>Data Analyst</option>
                  <option>DevOps Engineer</option>
                  <option>UI/UX Designer</option>
                </select>
              </div>

              {/* Resume Upload */}
              <div className="input-group input-group-wide">
                <label htmlFor="resume">Resume (PDF) *</label>
                <div 
                  className="file-input-wrapper"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.add("drag-over");
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.remove("drag-over");
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.remove("drag-over");
                    const files = e.dataTransfer.files;
                    if (files[0] && files[0].type === "application/pdf") {
                      setForm((currentForm) => ({
                        ...currentForm,
                        resume: files[0],
                      }));
                      setShowResume3D(true);
                    }
                  }}
                >
                  <input
                    id="resume"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      setForm((currentForm) => ({
                        ...currentForm,
                        resume: e.target.files[0],
                      }));
                      if (e.target.files[0]) {
                        setShowResume3D(true);
                      }
                    }}
                    className="file-input"
                  />
                  <label htmlFor="resume" className="file-input-label">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>
                      {form.resume
                        ? form.resume.name
                        : "Click or drag PDF here"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Status Message */}
              {submitStatus && (
                <div
                  className={`status-message ${submitStatus.type}`}
                  role="alert"
                >
                  <span>{submitStatus.type === "success" ? "OK" : "!"}</span>
                  {submitStatus.message}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`submit-button ${isSubmitting ? "submitting" : ""}`}
              >
                <span className="button-content">
                  {isSubmitting ? (
                    <>
                      <span className="spinner"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <span className="button-icon">-&gt;</span>
                      Submit Application
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default ApplicantDashboard;
