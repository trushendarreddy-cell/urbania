export type CitizenActivity = 'home' | 'working' | 'leisure';

export function getCitizenActivity(
  employmentStatus: 'employed' | 'unemployed' | 'inactive',
  age: number,
  timeOfDay: number
): CitizenActivity {
  // Inactive citizens (no road access) and children (<18) stay home
  if (employmentStatus === 'inactive' || age < 18) {
    return 'home';
  }

  // Adults with active road access follow schedule
  if (timeOfDay >= 8 && timeOfDay < 17) {
    // Work hours
    if (employmentStatus === 'employed') {
      return 'working';
    } else {
      return 'leisure';
    }
  } else if (timeOfDay >= 17 && timeOfDay < 22) {
    // Evening leisure
    return 'leisure';
  } else {
    // Night/home
    return 'home';
  }
}