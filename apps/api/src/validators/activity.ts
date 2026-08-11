import * as yup from "yup";

export const createActivitySchema = yup.object({
  type: yup
    .mixed<"RUN" | "RIDE" | "WALK">()
    .oneOf(["RUN", "RIDE", "WALK"], "Type must be RUN, RIDE, or WALK")
    .required("Type is required"),
  distance: yup
    .number()
    .positive("Distance must be greater than 0")
    .required("Distance is required"),
  duration: yup
    .number()
    .integer("Duration must be a whole number of seconds")
    .positive("Duration must be greater than 0")
    .required("Duration is required"),
  startedAt: yup
    .date()
    .required("startedAt is required"),
});