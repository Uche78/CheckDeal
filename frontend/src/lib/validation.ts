// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

// Password validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

// Phone number validation (basic)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
}

// Required field validation
export function isRequired(value: string | number | undefined | null): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

// Min length validation
export function minLength(value: string, min: number): boolean {
  return value.trim().length >= min;
}

// Max length validation
export function maxLength(value: string, max: number): boolean {
  return value.trim().length <= max;
}

// Numeric validation
export function isNumeric(value: string | number): boolean {
  if (typeof value === 'number') return !isNaN(value);
  return !isNaN(parseFloat(value)) && isFinite(Number(value));
}

// Positive number validation
export function isPositive(value: number): boolean {
  return value > 0;
}

// Date validation (YYYY-MM-DD format)
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// Age validation (must be 18+)
export function isMinAge(dateString: string, minAge: number = 18): boolean {
  const birthDate = new Date(dateString);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= minAge;
  }
  
  return age >= minAge;
}
