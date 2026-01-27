/* eslint-disable @next/next/no-img-element */

"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import "../auth.css";

type OnboardingStep =
  | "choose-path"
  | "service-selection"
  | "signup"
  | "classification"
  | "portfolio"
  | "availability-pricing"
  | "review"
  | "kyc"
  | "payment"
  | "complete";

type UserType = "client" | "artist" | null;

export default function SignupPage() {
  const router = useRouter();

  const [step, setStep] = useState<OnboardingStep>("choose-path");
  const [userType, setUserType] = useState<UserType>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [formData, setFormData] = useState({
    service: "",
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    interests: [] as string[],
    location: "",
    bio: "",
    portfolioImages: [] as string[],
    availability: [] as string[],
    pricingItems: [{ service: "", price: "" }] as {
      service: string;
      price: string;
    }[],
    accountType: "individual" as "individual" | "business",
    bankAccount: "",
    idNumber: "",
    businessReg: "",
    selfieUploaded: false,
  });

  const services = useMemo(
    () => [
      { id: "photographer", label: "Photographer", icon: "photo_camera" },
      { id: "videographer", label: "Videographer", icon: "videocam" },
      { id: "graphic-designer", label: "Graphic Designer", icon: "palette" },
      { id: "makeup-artist", label: "Makeup Artist", icon: "brush" },
      { id: "other", label: "Other", icon: "more_horiz" },
    ],
    [],
  );

  const interests = useMemo(
    () => [
      "Weddings",
      "Portraits",
      "Events",
      "Commercial",
      "Fashion",
      "Product",
      "Real Estate",
      "Sports",
      "Nature",
      "Street",
    ],
    [],
  );

  const weekDays = useMemo(
    () => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    [],
  );

  const getProgressPercentage = () => {
    const stepMap: Record<OnboardingStep, number> = {
      "choose-path": 0,
      "service-selection": 12,
      signup: 25,
      classification: 37,
      portfolio: 50,
      "availability-pricing": 62,
      review: 75,
      kyc: 87,
      payment: 95,
      complete: 100,
    };
    return stepMap[step] || 0;
  };

  const handleNext = () => {
    if (step === "choose-path" && userType === "artist")
      setStep("service-selection");
    else if (step === "choose-path" && userType === "client") setStep("signup");
    else if (step === "service-selection") setStep("signup");
    else if (step === "signup") setStep("classification");
    else if (step === "classification" && userType === "artist")
      setStep("portfolio");
    else if (step === "classification" && userType === "client")
      setStep("review");
    else if (step === "portfolio") setStep("availability-pricing");
    else if (step === "availability-pricing") setStep("review");
    else if (step === "review" && userType === "artist") setStep("payment");
    else if (step === "review" && userType === "client") setStep("complete");
    else if (step === "payment") setStep("kyc");
    else if (step === "kyc") setStep("complete");
  };

  const handleBack = () => {
    if (step === "service-selection") setStep("choose-path");
    else if (step === "signup" && userType === "artist")
      setStep("service-selection");
    else if (step === "signup" && userType === "client") setStep("choose-path");
    else if (step === "classification") setStep("signup");
    else if (step === "portfolio") setStep("classification");
    else if (step === "availability-pricing") setStep("portfolio");
    else if (step === "review" && userType === "artist")
      setStep("availability-pricing");
    else if (step === "review" && userType === "client")
      setStep("classification");
    else if (step === "payment") setStep("review");
    else if (step === "kyc") setStep("payment");
  };

  const toggleArrayItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const addPricingItem = () => {
    setFormData((prev) => ({
      ...prev,
      pricingItems: [...prev.pricingItems, { service: "", price: "" }],
    }));
  };

  const removePricingItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pricingItems: prev.pricingItems.filter((_, i) => i !== index),
    }));
  };

  const updatePricingItem = (
    index: number,
    field: "service" | "price",
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      pricingItems: prev.pricingItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const handleFileUpload = (type: "portfolio" | "selfie") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = type === "portfolio";

    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;

      if (type === "portfolio") {
        const newImages = Array.from(files).map((f) => URL.createObjectURL(f));
        setFormData((prev) => ({
          ...prev,
          portfolioImages: [...prev.portfolioImages, ...newImages].slice(0, 12),
        }));
      } else {
        setFormData((prev) => ({ ...prev, selfieUploaded: true }));
      }
    };

    input.click();
  };

  const canProceed = () => {
    if (step === "choose-path") return userType !== null;
    if (step === "service-selection") return formData.service !== "";
    if (step === "signup") {
      return (
        formData.firstName &&
        formData.lastName &&
        formData.username &&
        formData.email &&
        formData.phone &&
        formData.password &&
        formData.password === formData.confirmPassword
      );
    }
    if (step === "classification") return formData.location !== "";
    if (step === "portfolio") return formData.portfolioImages.length >= 4;
    if (step === "availability-pricing")
      return formData.availability.length > 0;
    if (step === "review") return agreedToTerms;
    if (step === "kyc") {
      return (
        formData.bankAccount &&
        formData.selfieUploaded &&
        (formData.accountType === "individual"
          ? formData.idNumber
          : formData.businessReg)
      );
    }
    return true;
  };

  const goToDashboard = () => router.push("/dashboard");
  const goExplore = () => router.push("/explore");

  return (
    <div className="auth-onboarding">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            Vendr<span>Man</span>
          </div>

          {step === "choose-path" && (
            <>
              <h1 className="auth-step-title">
                Welcome! Let&apos;s get started
              </h1>
              <p className="auth-step-subtitle">
                Choose how you&apos;d like to use VendrMan
              </p>
            </>
          )}

          {step === "service-selection" && (
            <>
              <h1 className="auth-step-title">What service do you offer?</h1>
              <p className="auth-step-subtitle">
                Select your primary service category
              </p>
              <div className="auth-warning-banner">
                <span className="material-symbols-outlined">info</span>
                <div className="auth-warning-text">
                  The first artists will be manually reviewed for safety and
                  quality assurance.
                </div>
              </div>
            </>
          )}

          {step === "signup" && (
            <>
              <h1 className="auth-step-title">Create your account</h1>
              <p className="auth-step-subtitle">
                We&apos;ll need some basic information to get you set up
              </p>
            </>
          )}

          {step === "classification" && (
            <>
              <h1 className="auth-step-title">Tell us about yourself</h1>
              <p className="auth-step-subtitle">
                Help {userType === "client" ? "artists" : "clients"} find you
              </p>
            </>
          )}

          {step === "portfolio" && (
            <>
              <h1 className="auth-step-title">Showcase your work</h1>
              <p className="auth-step-subtitle">
                Upload at least 4 projects from your portfolio
              </p>
            </>
          )}

          {step === "availability-pricing" && (
            <>
              <h1 className="auth-step-title">Availability &amp; Pricing</h1>
              <p className="auth-step-subtitle">Set your schedule and rates</p>
            </>
          )}

          {step === "review" && (
            <>
              <h1 className="auth-step-title">Review &amp; Submit</h1>
              <p className="auth-step-subtitle">
                Check your profile before going live
              </p>
            </>
          )}

          {step === "payment" && (
            <>
              <h1 className="auth-step-title">Activate Your Account</h1>
              <p className="auth-step-subtitle">
                One-time onboarding fee to get started
              </p>
            </>
          )}

          {step === "kyc" && (
            <>
              <h1 className="auth-step-title">Verify your identity</h1>
              <p className="auth-step-subtitle">
                Quick verification to complete activation
              </p>
            </>
          )}

          {step === "complete" && (
            <>
              <h1 className="auth-step-title">You&apos;re all set!</h1>
              <p className="auth-step-subtitle">Welcome to VendrMan</p>
            </>
          )}
        </div>

        <div className="auth-body">
          {step === "choose-path" && (
            <div className="auth-path-options">
              <div
                className={`auth-path-card ${userType === "client" ? "active" : ""}`}
                onClick={() => setUserType("client")}
              >
                <div className="auth-path-icon">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <div className="auth-path-label">I&apos;m a Client</div>
                <div className="auth-path-desc">
                  Find and book talented creatives for your project
                </div>
              </div>

              <div
                className={`auth-path-card ${userType === "artist" ? "active" : ""}`}
                onClick={() => setUserType("artist")}
              >
                <div className="auth-path-icon">
                  <span className="material-symbols-outlined">palette</span>
                </div>
                <div className="auth-path-label">I&apos;m an Artist</div>
                <div className="auth-path-desc">
                  Showcase your work and get booked by clients
                </div>
              </div>
            </div>
          )}

          {step === "service-selection" && (
            <div className="auth-service-grid">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`auth-service-card ${formData.service === service.id ? "active" : ""}`}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, service: service.id }))
                  }
                >
                  <span className="material-symbols-outlined auth-service-icon">
                    {service.icon}
                  </span>
                  <div className="auth-service-label">{service.label}</div>
                </div>
              ))}
            </div>
          )}

          {step === "signup" && (
            <div className="auth-form">
              <div className="auth-form-row">
                <div className="auth-form-group">
                  <label className="auth-label">
                    First Name <span className="auth-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Moosa"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="auth-form-group">
                  <label className="auth-label">
                    Last Name <span className="auth-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Sibiya"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">
                  Username <span className="auth-required">*</span>
                </label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="moosa03"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">
                  Email Address <span className="auth-required">*</span>
                </label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="moosa@vendrman.co.za"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">
                  Phone Number <span className="auth-required">*</span>
                </label>
                <input
                  type="tel"
                  className="auth-input"
                  placeholder="+27 XX XXX XXXX"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </div>

              <div className="auth-form-row">
                <div className="auth-form-group">
                  <label className="auth-label">
                    Password <span className="auth-required">*</span>
                  </label>
                  <div className="auth-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="auth-input"
                      placeholder="Create a secure password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                    />
                    <span
                      className="material-symbols-outlined auth-input-icon"
                      onClick={() => setShowPassword(!showPassword)}
                      role="button"
                      tabIndex={0}
                    >
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </div>
                </div>

                <div className="auth-form-group">
                  <label className="auth-label">
                    Confirm Password <span className="auth-required">*</span>
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="auth-input"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {step === "classification" && (
            <div className="auth-form">
              <div className="auth-form-group">
                <label className="auth-label">
                  Interests &amp; Specialties
                </label>
                <div className="auth-chip-group">
                  {interests.map((interest) => (
                    <div
                      key={interest}
                      className={`auth-chip ${formData.interests.includes(interest) ? "active" : ""}`}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          interests: toggleArrayItem(prev.interests, interest),
                        }))
                      }
                    >
                      {interest}
                    </div>
                  ))}
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">
                  Location <span className="auth-required">*</span>
                </label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="e.g., Johannesburg, South Africa"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Bio</label>
                <textarea
                  className="auth-input auth-textarea"
                  placeholder="Tell us a bit about yourself and your work..."
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bio: e.target.value }))
                  }
                />
              </div>
            </div>
          )}

          {step === "portfolio" && (
            <div className="auth-form">
              <div
                className="auth-upload-zone"
                onClick={() => handleFileUpload("portfolio")}
              >
                <div className="material-symbols-outlined auth-upload-icon">
                  cloud_upload
                </div>
                <div className="auth-upload-text">
                  Click to upload or drag and drop
                </div>
                <div className="auth-upload-hint">
                  Minimum 4 projects • JPG, PNG up to 10MB each
                </div>
              </div>

              {formData.portfolioImages.length > 0 && (
                <div className="auth-portfolio-grid">
                  {formData.portfolioImages.map((img, index) => (
                    <div key={index} className="auth-portfolio-item">
                      <img src={img} alt={`Portfolio ${index + 1}`} />
                      <div
                        className="auth-portfolio-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData((prev) => ({
                            ...prev,
                            portfolioImages: prev.portfolioImages.filter(
                              (_, i) => i !== index,
                            ),
                          }));
                        }}
                      >
                        <span className="material-symbols-outlined">close</span>
                      </div>
                    </div>
                  ))}

                  {formData.portfolioImages.length < 12 && (
                    <div
                      className="auth-portfolio-item"
                      onClick={() => handleFileUpload("portfolio")}
                    >
                      <span className="material-symbols-outlined">add</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === "availability-pricing" && (
            <div className="auth-form">
              <div className="auth-form-group">
                <label className="auth-label">Available Days</label>
                <div className="auth-week-grid">
                  {weekDays.map((day) => (
                    <button
                      key={day}
                      type="button"
                      className={`auth-day-btn ${formData.availability.includes(day) ? "active" : ""}`}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          availability: toggleArrayItem(prev.availability, day),
                        }))
                      }
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Pricing</label>
                <div className="auth-pricing-list">
                  {formData.pricingItems.map((item, index) => (
                    <div key={index} className="auth-pricing-item">
                      <input
                        type="text"
                        className="auth-input"
                        placeholder="Service (e.g., Wedding)"
                        value={item.service}
                        onChange={(e) =>
                          updatePricingItem(index, "service", e.target.value)
                        }
                      />
                      <input
                        type="text"
                        className="auth-input"
                        placeholder="Price (R)"
                        value={item.price}
                        onChange={(e) =>
                          updatePricingItem(index, "price", e.target.value)
                        }
                      />
                      {formData.pricingItems.length > 1 && (
                        <button
                          type="button"
                          className="auth-btn-icon danger"
                          onClick={() => removePricingItem(index)}
                        >
                          <span className="material-symbols-outlined">
                            delete
                          </span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="auth-add-pricing-btn"
                  onClick={addPricingItem}
                >
                  <span className="material-symbols-outlined">add</span>
                  Add another service
                </button>
              </div>
            </div>
          )}

          {step === "review" && (
            <div>
              <div className="auth-profile-preview">
                <div className="auth-preview-header">
                  <div className="auth-preview-avatar">
                    {formData.firstName[0] || "?"}
                    {formData.lastName[0] || "?"}
                  </div>
                  <div className="auth-preview-info">
                    <div className="auth-preview-name">
                      {formData.firstName} {formData.lastName}
                    </div>
                    <div className="auth-preview-role">
                      {services.find((s) => s.id === formData.service)?.label ||
                        "Client"}
                    </div>
                    <div className="auth-preview-location">
                      <span className="material-symbols-outlined">
                        location_on
                      </span>
                      {formData.location || "Location not set"}
                    </div>
                  </div>
                </div>

                {formData.bio && (
                  <div className="auth-preview-section">
                    <div className="auth-preview-section-title">About</div>
                    <div className="auth-preview-bio">{formData.bio}</div>
                  </div>
                )}

                {formData.interests.length > 0 && (
                  <div className="auth-preview-section">
                    <div className="auth-preview-section-title">
                      Specialties
                    </div>
                    <div className="auth-preview-tags">
                      {formData.interests.map((interest) => (
                        <div key={interest} className="auth-preview-tag">
                          {interest}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div
                className="auth-checkbox-group"
                onClick={() => setAgreedToTerms(!agreedToTerms)}
              >
                <input
                  type="checkbox"
                  className="auth-checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <div className="auth-checkbox-label">
                  I agree to the Terms of Service, Privacy Policy, and Community
                  Guidelines. I understand that my profile information will be
                  publicly visible.
                </div>
              </div>
            </div>
          )}

          {step === "payment" && (
            <div>
              <div className="auth-payment-card">
                <div className="auth-payment-amount">R499</div>
                <div className="auth-payment-label">
                  One-time Activation Fee
                </div>

                <div className="auth-payment-features">
                  <div className="auth-payment-feature">
                    <span className="material-symbols-outlined">
                      check_circle
                    </span>
                    <span>Get featured on the explore feed</span>
                  </div>
                  <div className="auth-payment-feature">
                    <span className="material-symbols-outlined">
                      check_circle
                    </span>
                    <span>Receive and manage client bookings</span>
                  </div>
                  <div className="auth-payment-feature">
                    <span className="material-symbols-outlined">
                      check_circle
                    </span>
                    <span>Access to messaging and calendar tools</span>
                  </div>
                  <div className="auth-payment-feature">
                    <span className="material-symbols-outlined">
                      check_circle
                    </span>
                    <span>Verified artist badge</span>
                  </div>
                </div>
              </div>

              <div className="auth-warning-banner">
                <span className="material-symbols-outlined">info</span>
                <div className="auth-warning-text">
                  Your profile is created but locked. Complete payment and KYC
                  verification to unlock all features.
                </div>
              </div>
            </div>
          )}

          {step === "kyc" && (
            <div className="auth-form">
              <div className="auth-form-group">
                <label className="auth-label">Account Type</label>
                <div className="auth-path-options">
                  <div
                    className={`auth-path-card ${formData.accountType === "individual" ? "active" : ""}`}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        accountType: "individual",
                      }))
                    }
                  >
                    <div className="auth-path-label">Individual</div>
                    <div className="auth-path-desc">Personal account</div>
                  </div>

                  <div
                    className={`auth-path-card ${formData.accountType === "business" ? "active" : ""}`}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        accountType: "business",
                      }))
                    }
                  >
                    <div className="auth-path-label">Business</div>
                    <div className="auth-path-desc">Registered company</div>
                  </div>
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">
                  Bank Account Number <span className="auth-required">*</span>
                </label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Enter your bank account number"
                  value={formData.bankAccount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      bankAccount: e.target.value,
                    }))
                  }
                />
              </div>

              {formData.accountType === "individual" ? (
                <div className="auth-form-group">
                  <label className="auth-label">
                    ID Number <span className="auth-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Enter your SA ID number"
                    value={formData.idNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        idNumber: e.target.value,
                      }))
                    }
                  />
                </div>
              ) : (
                <div className="auth-form-group">
                  <label className="auth-label">
                    Business Registration Number{" "}
                    <span className="auth-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Enter your company registration number"
                    value={formData.businessReg}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        businessReg: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              <div className="auth-form-group">
                <label className="auth-label">
                  Selfie Verification <span className="auth-required">*</span>
                </label>
                <div
                  className="auth-upload-zone"
                  onClick={() => handleFileUpload("selfie")}
                >
                  <div className="material-symbols-outlined auth-upload-icon">
                    {formData.selfieUploaded ? "check_circle" : "photo_camera"}
                  </div>
                  <div className="auth-upload-text">
                    {formData.selfieUploaded
                      ? "Selfie uploaded ✓"
                      : "Upload a clear photo of yourself"}
                  </div>
                  <div className="auth-upload-hint">JPG, PNG up to 5MB</div>
                </div>
              </div>

              <div className="auth-success-banner">
                <span className="material-symbols-outlined">lock</span>
                <div className="auth-success-text">
                  Your information is encrypted and securely stored. We&apos;ll
                  only use it for verification.
                </div>
              </div>
            </div>
          )}

          {step === "complete" && (
            <div className="auth-complete-container">
              <div className="auth-complete-icon">
                <span className="material-symbols-outlined">check_circle</span>
              </div>

              <h2 className="auth-complete-title">
                {userType === "artist"
                  ? "Your account is now active!"
                  : "Welcome to VendrMan!"}
              </h2>

              <p className="auth-complete-subtitle">
                {userType === "artist"
                  ? "Your profile is live and clients can discover and book you. Manage everything from your dashboard."
                  : "You&apos;re ready to browse and book amazing creatives for your next project."}
              </p>

              <div className="auth-complete-actions">
                <button
                  type="button"
                  className="auth-btn auth-btn-primary"
                  onClick={goToDashboard}
                >
                  <span className="material-symbols-outlined">dashboard</span>
                  Go to Dashboard
                </button>

                <button
                  type="button"
                  className="auth-btn auth-btn-secondary"
                  onClick={goExplore}
                >
                  <span className="material-symbols-outlined">explore</span>
                  Explore Artists
                </button>
              </div>
            </div>
          )}
        </div>

        {step !== "complete" && (
          <div className="auth-footer">
            {step !== "choose-path" ? (
              <button
                type="button"
                className="auth-btn auth-btn-secondary"
                onClick={handleBack}
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Back
              </button>
            ) : (
              <div />
            )}

            <div className="auth-progress-wrapper">
              <div className="auth-progress-bar">
                <div
                  className="auth-progress-fill"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
              <div className="auth-progress-text">
                {getProgressPercentage()}% Complete
              </div>
            </div>

            <button
              type="button"
              className="auth-btn auth-btn-primary"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              {step === "review" && userType === "artist"
                ? "Continue to Payment"
                : step === "review" && userType === "client"
                  ? "Create Account"
                  : step === "payment"
                    ? "Proceed to KYC"
                    : step === "kyc"
                      ? "Complete Setup"
                      : "Continue"}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
