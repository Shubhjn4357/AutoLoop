import { useState } from "react";

/**
 * Reusable form hook for handling form state, loading, and errors
 */
export function useForm<T extends Record<string, unknown>>(
  initialData: T,
  onSubmit: (data: T) => Promise<void>
) {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const setFieldValue = (name: string, value: unknown) => {
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrors({});
    
    try {
      await onSubmit(data);
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ form: error.message });
      } else {
        setErrors({ form: "An unexpected error occurred" });
      }
    } finally {
      setLoading(false);
    }
  };

  return { 
    data, 
    setData,
    handleChange, 
    handleSelectChange,
    setFieldValue,
    handleSubmit, 
    loading, 
    errors, 
    setErrors 
  };
}
