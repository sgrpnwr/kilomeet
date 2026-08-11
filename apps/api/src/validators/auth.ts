import * as yup from "yup";

export const signupSchema = yup.object({
  email: yup.string().email("Invalid email format").required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  name: yup
    .string()
    .min(2, "Name must be at least 2 characters")
    .required("Name is required"),
});


export const loginSchema = yup.object({
  email: yup.string().email("Invalid email format").required("Email is required"),
  password: yup.string().required("Password is required"),
});

// This gives us a TypeScript type derived from the schema —
// equivalent to Zod's automatic inference, just one extra explicit line in Yup
export type SignupInput = yup.InferType<typeof signupSchema>;