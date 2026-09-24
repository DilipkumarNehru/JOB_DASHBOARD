export const FieldWrapper = ({ label, children, required }) => (
  <div>
    {label && <label className="label">{label}{required && <span className="text-red-500"> *</span>}</label>}
    {children}
  </div>
);

export const TextInput = (props) => <input {...props} className={`input ${props.className || ''}`} />;

export const Select = (props) => <select {...props} className={`input ${props.className || ''}`} />;

export const TextArea = (props) => <textarea {...props} className={`input min-h-[90px] ${props.className || ''}`} />;