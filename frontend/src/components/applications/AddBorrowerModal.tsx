import { useState } from 'react';
import { createBorrower } from '../../lib/supabase/borrowers';

interface Props {
  applicationId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface BorrowerForm {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  employmentStatus: string;
  employer: string;
  annualIncome: number;
  borrowerType: 'co_borrower' | 'guarantor';
}

export default function AddBorrowerModal({ applicationId, onClose, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<BorrowerForm>({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    employmentStatus: 'full-time',
    employer: '',
    annualIncome: 0,
    borrowerType: 'co_borrower',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateFormData = (field: keyof BorrowerForm, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.substring(0, 10);
    let formatted = limited;
    if (limited.length >= 6) {
      formatted = `(${limited.substring(0, 3)}) ${limited.substring(3, 6)}-${limited.substring(6)}`;
    } else if (limited.length >= 3) {
      formatted = `(${limited.substring(0, 3)}) ${limited.substring(3)}`;
    }
    updateFormData('phone', formatted);
  };

  const formatCurrencyInput = (value: string): number => {
    const cleaned = value.replace(/[^0-9]/g, '');
    return cleaned ? parseInt(cleaned, 10) : 0;
  };

  const displayCurrency = (value: number): string => {
    if (value === 0) return '';
    return value.toLocaleString('en-CA');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (formData.phone) {
      const cleaned = formData.phone.replace(/\D/g, '');
      if (cleaned.length !== 10) {
        newErrors.phone = 'Phone number must be 10 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setSubmitting(true);

      await createBorrower({
        application_id: applicationId,
        borrower_type: formData.borrowerType,
        full_name: formData.fullName,
        email: formData.email || null,
        phone: formData.phone || null,
        date_of_birth: formData.dateOfBirth || null,
        employment_status: formData.employmentStatus || null,
        employer: formData.employer || null,
        annual_income: formData.annualIncome || null,
        sin: null,
        current_address: null,
        years_at_address: null,
        job_title: null,
        years_employed: null,
      });

      onSuccess();
    } catch (error) {
      console.error('Error adding borrower:', error);
      alert('Failed to add borrower. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Add Co-Borrower</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="borrowerType" className="block text-sm font-medium text-gray-700 mb-2">
                Borrower Type <span className="text-red-500">*</span>
              </label>
              <select
                id="borrowerType"
                value={formData.borrowerType}
                onChange={(e) => updateFormData('borrowerType', e.target.value as 'co_borrower' | 'guarantor')}
                className="input"
              >
                <option value="co_borrower">Co-Borrower</option>
                <option value="guarantor">Guarantor</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                value={formData.fullName}
                onChange={(e) => updateFormData('fullName', e.target.value)}
                className={`input ${errors.fullName ? 'border-red-500' : ''}`}
                placeholder="Jane Doe"
              />
              {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="jane@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone
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
                Employment Status
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
                Annual Income
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="text"
                  id="annualIncome"
                  value={displayCurrency(formData.annualIncome)}
                  onChange={(e) => updateFormData('annualIncome', formatCurrencyInput(e.target.value))}
                  className="input pl-7"
                  placeholder="75,000"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Adding...' : 'Add Co-Borrower'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
