import { useState, useEffect } from 'react';

interface FormData {
  // Borrower Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  sin: string;
  
  // Property Information
  propertyAddress: string;
  city: string;
  province: string;
  postalCode: string;
  propertyType: string;
  purchasePrice: string;
  downPayment: string;
  
  // Loan Details
  loanAmount: string;
  loanPurpose: string;
  employmentStatus: string;
  annualIncome: string;
}

const INITIAL_FORM_DATA: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  sin: '',
  propertyAddress: '',
  city: '',
  province: 'ON',
  postalCode: '',
  propertyType: 'single-family',
  purchasePrice: '',
  downPayment: '',
  loanAmount: '',
  loanPurpose: 'purchase',
  employmentStatus: 'full-time',
  annualIncome: '',
};

const STEPS = [
  { id: 1, name: 'Borrower Info', description: 'Personal information' },
  { id: 2, name: 'Property Details', description: 'Property information' },
  { id: 3, name: 'Loan Details', description: 'Loan information' },
  { id: 4, name: 'Review', description: 'Review and submit' },
];

// Format phone number as (416) 555-0123
const formatPhoneNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  const limited = cleaned.substring(0, 10);
  
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  } else {
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
  }
};

// Format SIN as 123-456-789
const formatSIN = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  const limited = cleaned.substring(0, 9);
  
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 6) {
    return `${limited.slice(0, 3)}-${limited.slice(3)}`;
  } else {
    return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`;
  }
};

// Format currency for display: 500000 -> $500,000.00
const formatCurrencyDisplay = (value: string | number): string => {
  if (!value) return '';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '';
  
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

// Parse currency input: remove $ and commas, keep numbers and decimal
const parseCurrencyInput = (value: string): string => {
  return value.replace(/[^0-9.]/g, '');
};

export default function CreateApplicationWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoCalculated, setAutoCalculated] = useState(false);

  // Auto-calculate loan amount when purchase price or down payment changes
  useEffect(() => {
    if (formData.purchasePrice && formData.downPayment) {
      const purchasePrice = parseFloat(formData.purchasePrice);
      const downPayment = parseFloat(formData.downPayment);
      
      if (!isNaN(purchasePrice) && !isNaN(downPayment) && purchasePrice >= downPayment) {
        const calculatedLoan = purchasePrice - downPayment;
        setFormData(prev => ({ ...prev, loanAmount: calculatedLoan.toString() }));
        setAutoCalculated(true);
      }
    }
  }, [formData.purchasePrice, formData.downPayment]);

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // If user manually edits loan amount, mark it as not auto-calculated
    if (field === 'loanAmount') {
      setAutoCalculated(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    updateFormData('phone', formatted);
  };

  const handleSINChange = (value: string) => {
    const formatted = formatSIN(value);
    updateFormData('sin', formatted);
  };

  const handleCurrencyChange = (field: keyof FormData, value: string) => {
    const parsed = parseCurrencyInput(value);
    updateFormData(field, parsed);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
      if (!formData.phone) newErrors.phone = 'Phone number is required';
      else if (formData.phone.replace(/\D/g, '').length !== 10) newErrors.phone = 'Phone number must be 10 digits';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      if (!formData.sin) newErrors.sin = 'SIN is required';
      else if (formData.sin.replace(/\D/g, '').length !== 9) newErrors.sin = 'SIN must be 9 digits';
    }

    if (step === 2) {
      if (!formData.propertyAddress) newErrors.propertyAddress = 'Property address is required';
      if (!formData.city) newErrors.city = 'City is required';
      if (!formData.postalCode) newErrors.postalCode = 'Postal code is required';
      if (!formData.purchasePrice) newErrors.purchasePrice = 'Purchase price is required';
      if (!formData.downPayment) newErrors.downPayment = 'Down payment is required';
      
      // Validate down payment is not more than purchase price
      if (formData.purchasePrice && formData.downPayment) {
        const purchasePrice = parseFloat(formData.purchasePrice);
        const downPayment = parseFloat(formData.downPayment);
        if (downPayment > purchasePrice) {
          newErrors.downPayment = 'Down payment cannot exceed purchase price';
        }
      }
    }

    if (step === 3) {
      if (!formData.loanAmount) newErrors.loanAmount = 'Loan amount is required';
      if (!formData.annualIncome) newErrors.annualIncome = 'Annual income is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (validateStep(3)) {
      // TODO: Submit to Supabase
      console.log('Submitting application:', formData);
      alert('Application submitted successfully! (This will connect to Supabase in a later task)');
      // Redirect to applications list
      window.location.href = '/applications';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between">
            {STEPS.map((step, stepIdx) => (
              <li key={step.id} className={`relative ${stepIdx !== STEPS.length - 1 ? 'flex-1' : ''}`}>
                <div className="flex items-center">
                  <div className="relative flex items-center justify-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        currentStep > step.id
                          ? 'border-primary-600 bg-primary-600'
                          : currentStep === step.id
                          ? 'border-primary-600 bg-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className={`text-sm font-medium ${currentStep === step.id ? 'text-primary-600' : 'text-gray-500'}`}>
                          {step.id}
                        </span>
                      )}
                    </div>
                    <div className="ml-4 min-w-0">
                      <p className={`text-sm font-medium ${currentStep === step.id ? 'text-primary-600' : 'text-gray-500'}`}>
                        {step.name}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  </div>
                  {stepIdx !== STEPS.length - 1 && (
                    <div className="flex-1 mx-4">
                      <div className={`h-0.5 ${currentStep > step.id ? 'bg-primary-600' : 'bg-gray-300'}`} />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Step 1: Borrower Information */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Borrower Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="label">First Name *</label>
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
                <label htmlFor="lastName" className="label">Last Name *</label>
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
                <label htmlFor="email" className="label">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className={`input ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="john.smith@example.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="label">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={`input ${errors.phone ? 'border-red-500' : ''}`}
                  placeholder="(416) 555-0123"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="label">Date of Birth *</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                  className={`input ${errors.dateOfBirth ? 'border-red-500' : ''}`}
                />
                {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>}
              </div>

              <div>
                <label htmlFor="sin" className="label">Social Insurance Number *</label>
                <input
                  type="text"
                  id="sin"
                  value={formData.sin}
                  onChange={(e) => handleSINChange(e.target.value)}
                  className={`input ${errors.sin ? 'border-red-500' : ''}`}
                  placeholder="123-456-789"
                />
                {errors.sin && <p className="mt-1 text-sm text-red-600">{errors.sin}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Property Details */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Property Details</h2>
            <div className="space-y-6">
              <div>
                <label htmlFor="propertyAddress" className="label">Property Address *</label>
                <input
                  type="text"
                  id="propertyAddress"
                  value={formData.propertyAddress}
                  onChange={(e) => updateFormData('propertyAddress', e.target.value)}
                  className={`input ${errors.propertyAddress ? 'border-red-500' : ''}`}
                  placeholder="123 Main Street"
                />
                {errors.propertyAddress && <p className="mt-1 text-sm text-red-600">{errors.propertyAddress}</p>}
                <p className="mt-1 text-xs text-gray-500">Note: Address autocomplete will be added in a future update</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="city" className="label">City *</label>
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
                  <label htmlFor="province" className="label">Province *</label>
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
                  </select>
                </div>

                <div>
                  <label htmlFor="postalCode" className="label">Postal Code *</label>
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
              </div>

              <div>
                <label htmlFor="propertyType" className="label">Property Type *</label>
                <select
                  id="propertyType"
                  value={formData.propertyType}
                  onChange={(e) => updateFormData('propertyType', e.target.value)}
                  className="input"
                >
                  <option value="single-family">Single Family Home</option>
                  <option value="condo">Condominium</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="multi-family">Multi-Family</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="purchasePrice" className="label">Purchase Price *</label>
                  <input
                    type="text"
                    id="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={(e) => handleCurrencyChange('purchasePrice', e.target.value)}
                    onBlur={(e) => {
                      // Format on blur
                      if (e.target.value) {
                        e.target.value = formatCurrencyDisplay(formData.purchasePrice);
                      }
                    }}
                    onFocus={(e) => {
                      // Remove formatting on focus
                      e.target.value = formData.purchasePrice;
                    }}
                    className={`input ${errors.purchasePrice ? 'border-red-500' : ''}`}
                    placeholder="$500,000.00"
                  />
                  {errors.purchasePrice && <p className="mt-1 text-sm text-red-600">{errors.purchasePrice}</p>}
                </div>

                <div>
                  <label htmlFor="downPayment" className="label">Down Payment *</label>
                  <input
                    type="text"
                    id="downPayment"
                    value={formData.downPayment}
                    onChange={(e) => handleCurrencyChange('downPayment', e.target.value)}
                    onBlur={(e) => {
                      if (e.target.value) {
                        e.target.value = formatCurrencyDisplay(formData.downPayment);
                      }
                    }}
                    onFocus={(e) => {
                      e.target.value = formData.downPayment;
                    }}
                    className={`input ${errors.downPayment ? 'border-red-500' : ''}`}
                    placeholder="$100,000.00"
                  />
                  {errors.downPayment && <p className="mt-1 text-sm text-red-600">{errors.downPayment}</p>}
                </div>
              </div>

              {/* Show calculated loan amount preview */}
              {formData.purchasePrice && formData.downPayment && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-blue-700">
                      Loan amount will be automatically calculated as: <strong>{formatCurrencyDisplay(parseFloat(formData.purchasePrice) - parseFloat(formData.downPayment))}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Loan Details */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Loan Details</h2>
            <div className="space-y-6">
              <div>
                <label htmlFor="loanAmount" className="label">Loan Amount *</label>
                <input
                  type="text"
                  id="loanAmount"
                  value={formData.loanAmount}
                  onChange={(e) => handleCurrencyChange('loanAmount', e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value) {
                      e.target.value = formatCurrencyDisplay(formData.loanAmount);
                    }
                  }}
                  onFocus={(e) => {
                    e.target.value = formData.loanAmount;
                  }}
                  className={`input ${errors.loanAmount ? 'border-red-500' : ''}`}
                  placeholder="$400,000.00"
                />
                {errors.loanAmount && <p className="mt-1 text-sm text-red-600">{errors.loanAmount}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  {autoCalculated ? 'Auto-calculated from Purchase Price - Down Payment (editable)' : 'You can adjust this amount as needed'}
                </p>
              </div>

              <div>
                <label htmlFor="loanPurpose" className="label">Loan Purpose *</label>
                <select
                  id="loanPurpose"
                  value={formData.loanPurpose}
                  onChange={(e) => updateFormData('loanPurpose', e.target.value)}
                  className="input"
                >
                  <option value="purchase">Purchase</option>
                  <option value="refinance">Refinance</option>
                  <option value="renovation">Renovation</option>
                </select>
              </div>

              <div>
                <label htmlFor="employmentStatus" className="label">Employment Status *</label>
                <select
                  id="employmentStatus"
                  value={formData.employmentStatus}
                  onChange={(e) => updateFormData('employmentStatus', e.target.value)}
                  className="input"
                >
                  <option value="full-time">Full-Time Employee</option>
                  <option value="part-time">Part-Time Employee</option>
                  <option value="self-employed">Self-Employed</option>
                  <option value="retired">Retired</option>
                </select>
              </div>

              <div>
                <label htmlFor="annualIncome" className="label">Annual Income *</label>
                <input
                  type="text"
                  id="annualIncome"
                  value={formData.annualIncome}
                  onChange={(e) => handleCurrencyChange('annualIncome', e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value) {
                      e.target.value = formatCurrencyDisplay(formData.annualIncome);
                    }
                  }}
                  onFocus={(e) => {
                    e.target.value = formData.annualIncome;
                  }}
                  className={`input ${errors.annualIncome ? 'border-red-500' : ''}`}
                  placeholder="$75,000.00"
                />
                {errors.annualIncome && <p className="mt-1 text-sm text-red-600">{errors.annualIncome}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Application</h2>
            
            <div className="space-y-6">
              {/* Borrower Info Summary */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Borrower Information</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="text-sm text-gray-900">{formData.firstName} {formData.lastName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{formData.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="text-sm text-gray-900">{formData.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                    <dd className="text-sm text-gray-900">{formData.dateOfBirth}</dd>
                  </div>
                </dl>
              </div>

              {/* Property Info Summary */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Property Details</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="text-sm text-gray-900">
                      {formData.propertyAddress}, {formData.city}, {formData.province} {formData.postalCode}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Property Type</dt>
                    <dd className="text-sm text-gray-900 capitalize">{formData.propertyType.replace('-', ' ')}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Purchase Price</dt>
                    <dd className="text-sm text-gray-900">{formatCurrencyDisplay(formData.purchasePrice)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Down Payment</dt>
                    <dd className="text-sm text-gray-900">{formatCurrencyDisplay(formData.downPayment)}</dd>
                  </div>
                </dl>
              </div>

              {/* Loan Info Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Loan Details</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Loan Amount</dt>
                    <dd className="text-sm text-gray-900">{formatCurrencyDisplay(formData.loanAmount)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Loan Purpose</dt>
                    <dd className="text-sm text-gray-900 capitalize">{formData.loanPurpose}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Employment Status</dt>
                    <dd className="text-sm text-gray-900 capitalize">{formData.employmentStatus.replace('-', ' ')}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Annual Income</dt>
                    <dd className="text-sm text-gray-900">{formatCurrencyDisplay(formData.annualIncome)}</dd>
                  </div>
                </dl>
              </div>

              {/* Confirmation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Ready to submit</h3>
                    <p className="mt-1 text-sm text-blue-700">
                      Please review all information carefully. Once submitted, the application will be processed for verification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex items-center space-x-3">
            <a href="/applications" className="text-sm text-gray-600 hover:text-gray-900">
              Cancel
            </a>
            {currentStep < STEPS.length ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn btn-primary"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="btn btn-primary"
              >
                Submit Application
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
