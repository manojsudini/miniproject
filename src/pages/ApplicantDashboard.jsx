import { useState, useRef, useEffect } from "react";
import "./ApplicantDashboard.css";
import Navbar from "../components/Navbar.jsx";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import * as pdfjsLib from "pdfjs-dist";

async function renderPDFToCanvas(pdfFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // Use a stable version of pdf.js worker with https
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        const pdf = await pdfjsLib.getDocument({ data: e.target.result }).promise;
        const page = await pdf.getPage(1);
        
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        const viewport = page.getViewport({ scale: 4 });
        
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
  const sceneRef = useRef(null);
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
      scene.background = new THREE.Color(0x0a0e27);
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 1000);
      camera.position.z = 7;
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setClearColor(0x0a0e27, 1);
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Create 3D card with PDF texture - FULL VIEW SIZE
      const geometry = new THREE.BoxGeometry(2.2, 3.0, 0.06);
      
      // FIXED: 6 materials for 6 faces of BoxGeometry
      // Order: Right (0), Left (1), Top (2), Bottom (3), Front (4), Back (5)
      let materials = [
        new THREE.MeshPhongMaterial({ color: 0x1a1a2e }), // Right face (index 0)
        new THREE.MeshPhongMaterial({ color: 0x1a1a2e }), // Left face (index 1)
        new THREE.MeshPhongMaterial({ color: 0x16213e }), // Top face (index 2)
        new THREE.MeshPhongMaterial({ color: 0x16213e }), // Bottom face (index 3)
        new THREE.MeshPhongMaterial({                     // Front face (index 4) - PDF goes here
          color: 0xffffff,
          emissive: 0x4f46e5,
          emissiveIntensity: 0.2,
        }),
        new THREE.MeshPhongMaterial({ color: 0x1a1a2e }), // Back face (index 5)
      ];

      // Render PDF to canvas and apply as front texture (index 4)
      if (resume) {
        try {
          const pdfCanvas = await renderPDFToCanvas(resume);
          const texture = new THREE.CanvasTexture(pdfCanvas);
          texture.needsUpdate = true;
          materials[4] = new THREE.MeshPhongMaterial({ map: texture });
        } catch (error) {
          console.error("Failed to render PDF:", error);
        }
      }

      const card = new THREE.Mesh(geometry, materials);
      card.castShadow = true;
      card.receiveShadow = true;
      scene.add(card);
      cardRef.current = card;

      // Lighting
      const light1 = new THREE.DirectionalLight(0xffffff, 1.2);
      light1.position.set(5, 5, 5);
      light1.castShadow = true;
      scene.add(light1);

      const light2 = new THREE.DirectionalLight(0x4f46e5, 0.8);
      light2.position.set(-5, 5, 5);
      scene.add(light2);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const handleMouseMove = (event) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouseRef.current.x = (event.clientX - rect.left) / rect.width;
        mouseRef.current.y = (event.clientY - rect.top) / rect.height;
      };

      container.addEventListener("mousemove", handleMouseMove);

      const animate = () => {
        animationRef.current = requestAnimationFrame(animate);

        if (cardRef.current) {
          // Smooth rotation based on mouse position - reduced for better visibility
          const targetX = (mouseRef.current.y - 0.5) * Math.PI * 0.25;
          const targetY = (mouseRef.current.x - 0.5) * Math.PI * 0.4;
          
          rotationRef.current.x += (targetX - rotationRef.current.x) * 0.05;
          rotationRef.current.y += (targetY - rotationRef.current.y) * 0.05;

          cardRef.current.rotation.x = rotationRef.current.x;
          cardRef.current.rotation.y = rotationRef.current.y;
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
        }
      };

      window.addEventListener("resize", handleResize);

      // Store cleanup function
      container._cleanup = () => {
        window.removeEventListener("resize", handleResize);
        container.removeEventListener("mousemove", handleMouseMove);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        geometry.dispose();
        materials.forEach((m) => {
          if (m.map) m.map.dispose();
          m.dispose();
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

  const handleSubmit = async () => {
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
        "http://localhost:5000/api/applications/apply",
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
                ? "Move your mouse around the resume to rotate it 360°"
                : "Upload a PDF to see 3D preview"}
            </p>
          </div>

          {/* Right side - Application Form */}
          <div className="apply-card-enhanced">
            <div className="card-header">
              <h1>Apply for Job</h1>
              <p className="subtitle">Join our amazing team</p>
            </div>

            <div className="form-container">
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
              <div className="input-group">
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
                      setForm({ ...form, resume: files[0] });
                      setShowResume3D(true);
                    }
                  }}
                >
                  <input
                    id="resume"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      setForm({ ...form, resume: e.target.files[0] });
                      if (e.target.files[0]) {
                        setShowResume3D(true);
                      }
                    }}
                    className="file-input"
                  />
                  <div className="file-input-label">
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
                  </div>
                </div>
              </div>

              {/* Status Message */}
              {submitStatus && (
                <div
                  className={`status-message ${submitStatus.type}`}
                  role="alert"
                >
                  <span>
                    {submitStatus.type === "success" ? "✓" : "⚠"}
                  </span>
                  {submitStatus.message}
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
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
                      <span className="button-icon">→</span>
                      Submit Application
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ApplicantDashboard;
