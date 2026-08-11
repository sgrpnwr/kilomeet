export function validateActivityForm(input: {
  type: string;
  distance: string;
  duration: string;
}) {
  const errors: string[] = [];

  if (!['RUN', 'RIDE', 'WALK'].includes(input.type)) {
    errors.push('Please select a valid activity type');
  }

  const distanceNum = parseFloat(input.distance);
  if (isNaN(distanceNum) || distanceNum <= 0) {
    errors.push('Distance must be a positive number');
  }

  const durationNum = parseInt(input.duration, 10);
  if (isNaN(durationNum) || durationNum <= 0) {
    errors.push('Duration must be a positive whole number');
  }

  return { isValid: errors.length === 0, errors, distanceNum, durationNum };
}