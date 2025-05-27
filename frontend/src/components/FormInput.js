import React from 'react';

const FormInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required = false,
  options = [],
  placeholder = '',
  disabled = false,
  error = '',
}) => {
  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className="input-field"
          >
            <option value="">{placeholder || 'Select an option'}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'textarea':
        return (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            disabled={disabled}
            className="input-field"
            rows={4}
          />
        );
      default:
        return (
          <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            disabled={disabled}
            className="input-field"
          />
        );
    }
  };

  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className={`block text-sm font-medium text-gray-700 mb-1 ${required ? 'required-field' : ''}`}
      >
        {label}
      </label>
      {renderInput()}
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
};

export default FormInput;
