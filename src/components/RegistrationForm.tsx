"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, User, Mail, Building, Tag, Check, Sparkles } from "lucide-react";
import { ALLOWED_DOMAIN_INTERESTS } from "@/lib/validations";

interface RegistrationFormProps {
  eventId: string;
  eventTitle: string;
  remainingSeats: number;
  availableInterests?: string[];
  onRegistrationSuccess?: (updatedEvent: { confirmedCount: number; remainingSeats: number }) => void;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  collegeOrOrganization?: string;
  interests?: string[];
}

export default function RegistrationForm({
  eventId,
  eventTitle,
  remainingSeats,
  availableInterests = ALLOWED_DOMAIN_INTERESTS as unknown as string[],
  onRegistrationSuccess,
}: RegistrationFormProps) {
  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [collegeOrOrganization, setCollegeOrOrganization] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // UI status states
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    fullName: string;
    email: string;
    collegeOrOrganization: string;
    interests: string[];
    createdAt: string;
  } | null>(null);

  const isFull = remainingSeats <= 0;

  // Client-side validation function
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!collegeOrOrganization.trim()) {
      newErrors.collegeOrOrganization = "College or organization is required.";
    } else if (collegeOrOrganization.trim().length < 2) {
      newErrors.collegeOrOrganization = "College or organization must be at least 2 characters.";
    }

    if (selectedInterests.length === 0) {
      newErrors.interests = ["Please select at least one domain interest."];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) => {
      const exists = prev.includes(interest);
      const updated = exists ? prev.filter((i) => i !== interest) : [...prev, interest];

      // Clear interest error if at least one is selected
      if (updated.length > 0 && errors.interests) {
        setErrors((e) => ({ ...e, interests: undefined }));
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isFull) return;

    // Reset previous server error messages
    setDuplicateError(null);
    setGeneralError(null);

    // Validate client-side
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/events/${eventId}/registrations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          collegeOrOrganization: collegeOrOrganization.trim(),
          interests: selectedInterests,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Specifically check for duplicate registration (HTTP 409)
        if (
          response.status === 409 &&
          data.error?.code === "DUPLICATE_REGISTRATION"
        ) {
          setDuplicateError(data.error.message || "This email is already registered for this event.");
          return;
        }

        if (
          response.status === 409 &&
          data.error?.code === "CAPACITY_EXCEEDED"
        ) {
          setGeneralError(data.error.message || "Event has reached maximum capacity.");
          return;
        }

        // Other validation or server errors
        setGeneralError(
          data.error?.message || "Registration failed. Please check your information and try again."
        );
        return;
      }

      // Successful registration
      const reg = data.data.registration;
      const updatedEvent = data.data.event;

      setSubmittedData({
        fullName: reg.fullName,
        email: reg.email,
        collegeOrOrganization: reg.collegeOrOrganization,
        interests: reg.interests,
        createdAt: reg.createdAt,
      });

      // Notify parent to immediately update remaining seats & registration count
      if (onRegistrationSuccess && updatedEvent) {
        onRegistrationSuccess({
          confirmedCount: updatedEvent.confirmedCount,
          remainingSeats: updatedEvent.remainingSeats,
        });
      }
    } catch (err) {
      console.error("Submission failed:", err);
      setGeneralError("Network connection error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already successfully submitted in this session, show confirmed confirmation state
  if (submittedData) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div className="mt-5 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-semibold text-emerald-800">
            Registration Confirmed
          </span>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            You&apos;re Officially Registered!
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Your seat for <span className="font-semibold text-slate-900">{eventTitle}</span> has been confirmed and reserved.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-3 text-sm">
          <div className="flex justify-between border-b border-slate-200/60 pb-2">
            <span className="text-slate-500">Attendee Name</span>
            <span className="font-semibold text-slate-900">{submittedData.fullName}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-2">
            <span className="text-slate-500">Registered Email</span>
            <span className="font-semibold text-slate-900">{submittedData.email}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-2">
            <span className="text-slate-500">Organization</span>
            <span className="font-semibold text-slate-900">{submittedData.collegeOrOrganization}</span>
          </div>
          <div>
            <span className="block text-slate-500 mb-1.5">Selected Domain Interests:</span>
            <div className="flex flex-wrap gap-1.5">
              {submittedData.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-md bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              setSubmittedData(null);
              setFullName("");
              setEmail("");
              setCollegeOrOrganization("");
              setSelectedInterests([]);
              setDuplicateError(null);
              setGeneralError(null);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Register Another Attendee
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
    >
      <div className="mb-6">
        <h3 className="text-xl font-bold tracking-tight text-slate-900">
          Participant Registration
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Enter your details below to reserve your seat for {eventTitle}.
        </p>
      </div>

      {/* Duplicate Registration Error Banner (Preserves user input) */}
      {duplicateError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-rose-900">Registration Notice</h4>
            <p className="mt-0.5">{duplicateError}</p>
            <p className="mt-1 text-xs text-rose-700">
              Your entered information has been preserved. If this is an error, please verify your email address.
            </p>
          </div>
        </div>
      )}

      {/* General Error Banner */}
      {generalError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-amber-900">Submission Alert</h4>
            <p className="mt-0.5">{generalError}</p>
          </div>
        </div>
      )}

      {/* Capacity Alert if full */}
      {isFull && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <div>
            <p className="font-semibold">Event Full</p>
            <p className="text-xs">This event has reached full capacity. Registrations are currently closed.</p>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {/* Full Name Field */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-semibold text-slate-800">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative mt-1.5">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <User className="h-4 w-4" />
            </div>
            <input
              id="fullName"
              name="fullName"
              type="text"
              disabled={isSubmitting || isFull}
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors((err) => ({ ...err, fullName: undefined }));
              }}
              placeholder="e.g. Jane Doe"
              className={`block w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                errors.fullName
                  ? "border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-200"
                  : "border-slate-300 text-slate-900 focus:border-indigo-600 focus:ring-indigo-100"
              }`}
            />
          </div>
          {errors.fullName && (
            <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errors.fullName}</span>
            </p>
          )}
        </div>

        {/* Email Address Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-slate-800">
            Email Address <span className="text-rose-500">*</span>
          </label>
          <div className="relative mt-1.5">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              disabled={isSubmitting || isFull}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((err) => ({ ...err, email: undefined }));
                if (duplicateError) setDuplicateError(null);
              }}
              placeholder="name@example.com"
              className={`block w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                errors.email
                  ? "border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-200"
                  : "border-slate-300 text-slate-900 focus:border-indigo-600 focus:ring-indigo-100"
              }`}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errors.email}</span>
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            Duplicate prevention applies per event. Case and whitespace are automatically normalized.
          </p>
        </div>

        {/* College or Organization Field */}
        <div>
          <label htmlFor="collegeOrOrganization" className="block text-sm font-semibold text-slate-800">
            College or Organization <span className="text-rose-500">*</span>
          </label>
          <div className="relative mt-1.5">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Building className="h-4 w-4" />
            </div>
            <input
              id="collegeOrOrganization"
              name="collegeOrOrganization"
              type="text"
              disabled={isSubmitting || isFull}
              value={collegeOrOrganization}
              onChange={(e) => {
                setCollegeOrOrganization(e.target.value);
                if (errors.collegeOrOrganization) {
                  setErrors((err) => ({ ...err, collegeOrOrganization: undefined }));
                }
              }}
              placeholder="e.g. Stanford University / Acme Corp"
              className={`block w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                errors.collegeOrOrganization
                  ? "border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-200"
                  : "border-slate-300 text-slate-900 focus:border-indigo-600 focus:ring-indigo-100"
              }`}
            />
          </div>
          {errors.collegeOrOrganization && (
            <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errors.collegeOrOrganization}</span>
            </p>
          )}
        </div>

        {/* Domain Interests Multi-Select */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-slate-800">
              Domain Interests <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs text-slate-500">Select all that apply</span>
          </div>

          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {availableInterests.map((interest) => {
              const selected = selectedInterests.includes(interest);
              return (
                <button
                  type="button"
                  key={interest}
                  disabled={isSubmitting || isFull}
                  onClick={() => toggleInterest(interest)}
                  className={`flex items-center justify-between rounded-xl border p-2.5 text-left text-xs font-medium transition ${
                    selected
                      ? "border-indigo-600 bg-indigo-50/80 text-indigo-900 font-semibold shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate mr-1">{interest}</span>
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                      selected
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {selected && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {errors.interests && (
            <p className="mt-2 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errors.interests[0]}</span>
            </p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-8">
        <button
          type="submit"
          disabled={isSubmitting || isFull}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold text-white shadow-md transition ${
            isFull
              ? "bg-slate-300 cursor-not-allowed shadow-none"
              : isSubmitting
              ? "bg-indigo-500 cursor-wait"
              : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing Registration...</span>
            </>
          ) : isFull ? (
            <span>Registration Closed (Full Capacity)</span>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Complete Registration</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
