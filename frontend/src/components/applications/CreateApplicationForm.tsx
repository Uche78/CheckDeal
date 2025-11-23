import { useState } from 'react';
import { createApplication } from '../../lib/supabase/applications';
import { createBorrower } from '../../lib/supabase/borrowers';

interface FormData {
  // Borrower Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  employmentStatus: string;
  employer: string;
  annualIncome: number;

  // Property Information
  propertyAddress: string;
  city: string;
  province: string;
  postalCode: string;
  propertyType: string;
  purchasePrice: number;
  downPayment: number;
  loanAmount: number;
  loanPurpose: string;
}

export default function CreateApplicationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    employmentStatus: 'full-time',
    employer: '',
    annualIncome: 0,
    propertyAddress: '',
    city: '',
    province: 'ON',
    postalCode: '',
    propertyType: 'single-family',
    purchasePrice: 0,
    downPayment: 0,
    loanAmount: 0,
    loanPurpose: 'purchase',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateFormData = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Format phone number as user types (XXX) XXX-XXXX
  const handlePhoneChange = (value: string) => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limited = cleaned.substring(0, 10);
    
    // Format as (XXX) XXX-XXXX
    let formatted = limited;
    if (limited.length >= 6) {
      formatted = `(${limited.substring(0, 3)}) ${limited.substring(3, 6)}-${limited.substring(6)}`;
    } else if (limited.length >= 3) {
      formatted = `(${limited.substring(0, 3)}) ${limited.substring(3)}`;
    }
    
    updateFormData('phone', formatted);
  };

  // Format currency input
  const formatCurrencyInput = (value: string): number => {
    const cleaned = value.replace(/[^0-9]/g, '');
    return cleaned ? parseInt(cleaned, 10) : 0;
  };

  const displayCurrency = (value: number): string => {
    if (value === 0) return '';
    return value.toLocaleString('en-CA');
  };

  // Calculate loan amount when purchase price or down payment changes
  const handlePurchasePriceChange = (value: string) => {
    const amount = formatCurrencyInput(value);
    updateFormData('purchasePrice', amount);
    const loanAmount = amount - formData.downPayment;
    updateFormData('loanAmount', Math.max(0, loanAmount));
  };

  const handleDownPaymentChange = (value: string) => {
    const amount = formatCurrencyInput(value);
    updateFormData('downPayment', amount);
    const loanAmount = formData.purchasePrice - amount;
    updateFormData('loanAmount', Math.max(0, loanAmount));
  };

  const handleLoanAmountChange = (value: string) => {
    const amount = formatCurrencyInput(value);
    updateFormData('loanAmount', amount);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Borrower validation
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else {
        const cleaned = formData.phone.replace(/\D/g, '');
        if (cleaned.length !== 10) {
          newErrors.phone = 'Phone number must be 10 digits';
        }
      }
      if (formData.annualIncome <= 0) {
        newErrors.annualIncome = 'Annual income must be greater than 0';
      }
    } else if (step === 2) {
      // Property validation
      if (!formData.propertyAddress.trim()) {
        newErrors.propertyAddress = 'Property address is required';
      }
      if (!formData.city.trim()) {
        newErrors.city = 'City is required';
      }
      if (!formData.postalCode.trim()) {
        newErrors.postalCode = 'Postal code is required';
      }
      if (formData.purchasePrice <= 0) {
        newErrors.purchasePrice = 'Purchase price must be greater than 0';
      }
      if (formData.downPayment < 0) {
        newErrors.downPayment = 'Down payment cannot be negative';
      }
      if (formData.downPayment >= formData.purchasePrice) {
        newErrors.downPayment = 'Down payment must be less than purchase price';
      }
      if (formData.loanAmount <= 0) {
        newErrors.loanAmount = 'Loan amount must be greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    try {
      setSubmitting(true);

      // Combine first and last name
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

      // Combine address fields into single property_address
const fullAddress = `${formData.propertyAddress}, ${formData.city}, ${formData.province} ${formData.postalCode}`;

// Create application
const newApplication = await createApplication({
  property_address: fullAddress,
  property_type: formData.propertyType as any,
  property_value: formData.purchasePrice,
  loan_amount: formData.loanAmount,
  down_payment: formData.downPayment,
  loan_purpose: formData.loanPurpose as any,
  status: 'pending',
});

      // Create primary borrower
      await createBorrower({
        application_id: newApplication.id,
        borrower_type: 'primary',
        full_name: fullName,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth || null,
        employment_status: formData.employmentStatus as any,
        employer: formData.employer || null,
        annual_income: formData.annualIncome || null,
      });

      // Redirect to the new application
      window.location.href = `/applications/${newApplication.id}`;
} catch (error: any) {
  console.error('Full error details:', error);
  console.error('Error message:', error.message);
  console.error('Error details:', error.details);
  console.error('Error hint:', error.hint);
  
  const errorMessage = error.message || 'Failed to create application';
  const errorDetails = error.details || '';
  
  alert(`Failed to create application:\n${errorMessage}\n${errorDetails}`);
  setSubmitting(false);
}
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const downPaymentPercent = formData.purchasePrice > 0
    ? ((formData.downPayment / formData.purchasePrice) * 100).toFixed(1)
    : '0';

  const fullName = `${formData.firstName} ${formData.lastName}`.trim();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className={`flex-1 ${currentStep >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  currentStep >= 1
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                1
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium">Step 1</div>
                <div className="text-xs">Borrower Info</div>
              </div>
            </div>
          </div>

          <div className={`flex-1 border-t-2 ${currentStep >= 2 ? 'border-primary-600' : 'border-gray-300'} mx-4`}></div>

          <div className={`flex-1 ${currentStep >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  currentStep >= 2
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                2
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium">Step 2</div>
                <div className="text-xs">Property Info</div>
              </div>
            </div>
          </div>

          <div className={`flex-1 border-t-2 ${currentStep >= 3 ? 'border-primary-600' : 'border-gray-300'} mx-4`}></div>

          <div className={`flex-1 ${currentStep >= 3 ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  currentStep >= 3
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                3
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium">Step 3</div>
                <div className="text-xs">Review</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="card">
        <div className="card-body">
          {/* Step 1: Borrower Information */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Borrower Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    className={`input ${errors.firstName ? 'border-red-500' : ''}`}
                    placeholder="John"
                  />
                  {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    className={`input ${errors.lastName ? 'border-red-500' : ''}`}
                    placeholder="Smith"
                  />
                  {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className={`input ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="john@example.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={`input ${errors.phone ? 'border-red-500' : ''}`}
                    placeholder="(416) 555-0123"
                    maxLength={14}
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label htmlFor="employmentStatus" className="block text-sm font-medium text-gray-700 mb-2">
                    Employment Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="employmentStatus"
                    value={formData.employmentStatus}
                    onChange={(e) => updateFormData('employmentStatus', e.target.value)}
                    className="input"
                  >
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="self-employed">Self Employed</option>
                    <option value="contract">Contract</option>
                    <option value="retired">Retired</option>
                    <option value="unemployed">Unemployed</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="employer" className="block text-sm font-medium text-gray-700 mb-2">
                    Employer
                  </label>
                  <input
                    type="text"
                    id="employer"
                    value={formData.employer}
                    onChange={(e) => updateFormData('employer', e.target.value)}
                    className="input"
                    placeholder="ABC Company Inc."
                  />
                </div>

                <div>
                  <label htmlFor="annualIncome" className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Income <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="text"
                      id="annualIncome"
                      value={displayCurrency(formData.annualIncome)}
                      onChange={(e) => updateFormData('annualIncome', formatCurrencyInput(e.target.value))}
                      className={`input pl-7 ${errors.annualIncome ? 'border-red-500' : ''}`}
                      placeholder="75,000"
                    />
                  </div>
                  {errors.annualIncome && <p className="mt-1 text-sm text-red-600">{errors.annualIncome}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Property Information */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Property Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="propertyAddress" className="block text-sm font-medium text-gray-700 mb-2">
                    Property Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="propertyAddress"
                    value={formData.propertyAddress}
                    onChange={(e) => updateFormData('propertyAddress', e.target.value)}
                    className={`input ${errors.propertyAddress ? 'border-red-500' : ''}`}
                    placeholder="123 Main Street"
                  />
                  {errors.propertyAddress && <p className="mt-1 text-sm text-red-600">{errors.propertyAddress}</p>}
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    className={`input ${errors.city ? 'border-red-500' : ''}`}
                    placeholder="Toronto"
                  />
                  {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                </div>

                <div>
                  <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-2">
                    Province <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="province"
                    value={formData.province}
                    onChange={(e) => updateFormData('province', e.target.value)}
                    className="input"
                  >
                    <option value="ON">Ontario</option>
                    <option value="BC">British Columbia</option>
                    <option value="AB">Alberta</option>
                    <option value="QC">Quebec</option>
                    <option value="MB">Manitoba</option>
                    <option value="SK">Saskatchewan</option>
                    <option value="NS">Nova Scotia</option>
                    <option value="NB">New Brunswick</option>
                    <option value="NL">Newfoundland and Labrador</option>
                    <option value="PE">Prince Edward Island</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => updateFormData('postalCode', e.target.value)}
                    className={`input ${errors.postalCode ? 'border-red-500' : ''}`}
                    placeholder="M5V 3A8"
                  />
                  {errors.postalCode && <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>}
                </div>

                <div>
                  <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-2">
                    Property Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="propertyType"
                    value={formData.propertyType}
                    onChange={(e) => updateFormData('propertyType', e.target.value)}
                    className="input"
                  >
                    <option value="single-family">Single Family Home</option>
                    <option value="condo">Condo</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="multi-family">Multi-Family</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="loanPurpose" className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Purpose <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="loanPurpose"
                    value={formData.loanPurpose}
                    onChange={(e) => updateFormData('loanPurpose', e.target.value)}
                    className="input"
                  >
                    <option value="purchase">Purchase</option>
                    <option value="refinance">Refinance</option>
                    <option value="equity">Home Equity</option>
                    <option value="renewal">Renewal</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="text"
                      id="purchasePrice"
                      value={displayCurrency(formData.purchasePrice)}
                      onChange={(e) => handlePurchasePriceChange(e.target.value)}
                      className={`input pl-7 ${errors.purchasePrice ? 'border-red-500' : ''}`}
                      placeholder="500,000"
                    />
                  </div>
                  {errors.purchasePrice && <p className="mt-1 text-sm text-red-600">{errors.purchasePrice}</p>}
                </div>

                <div>
                  <label htmlFor="downPayment" className="block text-sm font-medium text-gray-700 mb-2">
                    Down Payment <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="text"
                      id="downPayment"
                      value={displayCurrency(formData.downPayment)}
                      onChange={(e) => handleDownPaymentChange(e.target.value)}
                      className={`input pl-7 ${errors.downPayment ? 'border-red-500' : ''}`}
                      placeholder="100,000"
                    />
                  </div>
                  {errors.downPayment && <p className="mt-1 text-sm text-red-600">{errors.downPayment}</p>}
                  {formData.purchasePrice > 0 && (
                    <p className="mt-1 text-sm text-gray-600">Down payment: {downPaymentPercent}%</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="text"
                      id="loanAmount"
                      value={displayCurrency(formData.loanAmount)}
                      onChange={(e) => handleLoanAmountChange(e.target.value)}
                      className={`input pl-7 text-2xl font-bold text-primary-600 ${errors.loanAmount ? 'border-red-500' : ''}`}
                      placeholder="400,000"
                    />
                  </div>
                  {errors.loanAmount && <p className="mt-1 text-sm text-red-600">{errors.loanAmount}</p>}
                  <p className="mt-1 text-sm text-gray-600">
                    Auto-calculated: Purchase Price ({formatCurrency(formData.purchasePrice)}) - Down Payment (
                    {formatCurrency(formData.downPayment)}), or enter manually
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Application</h2>

              <div className="space-y-6">
                {/* Borrower Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Borrower Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{formData.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Employment:</span>
                      <span className="font-medium capitalize">{formData.employmentStatus.replace('-', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Annual Income:</span>
                      <span className="font-medium">{formatCurrency(formData.annualIncome)}</span>
                    </div>
                  </div>
                </div>

                {/* Property Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Property Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Address:</span>
                      <span className="font-medium text-right">{formData.propertyAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">City:</span>
                      <span className="font-medium">
                        {formData.city}, {formData.province}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Property Type:</span>
                      <span className="font-medium capitalize">{formData.propertyType.replace('-', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Purchase Price:</span>
                      <span className="font-medium">{formatCurrency(formData.purchasePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Down Payment:</span>
                      <span className="font-medium">
                        {formatCurrency(formData.downPayment)} ({downPaymentPercent}%)
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
                      <span className="text-gray-900 font-semibold">Loan Amount:</span>
                      <span className="font-bold text-primary-600">{formatCurrency(formData.loanAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            <div>
              {currentStep > 1 && (
                <button onClick={handleBack} className="btn bg-white text-gray-700 border border-gray-300 hover:bg-gray-50">
                  Back
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <a href="/applications" className="btn bg-white text-gray-700 border border-gray-300 hover:bg-gray-50">
                Cancel
              </a>

              {currentStep < 3 ? (
                <button onClick={handleNext} className="btn btn-primary">
                  Next Step
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Creating Application...' : 'Create Application'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
