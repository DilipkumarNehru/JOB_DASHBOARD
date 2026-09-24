import { useState, useCallback } from 'react';

export const useForm = (initialValues = {}, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues((v) => ({ ...v, [name]: type === 'checkbox' ? checked : value }));
  };

  const setValue = (name, value) => setValues((v) => ({ ...v, [name]: value }));

  const reset = (next = initialValues) => {
    setValues(next);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      await onSubmit(values);
    } catch (err) {
      setErrors({ submit: err.message });
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return { values, errors, submitting, handleChange, setValue, reset, handleSubmit };
};