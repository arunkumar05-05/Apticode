export function getAvatarInitial(name?: string, email?: string): string {
  let raw = name?.trim() || '';
  if (!raw || raw === 'New Candidate' || raw.includes('@')) {
    const saved = email ? localStorage.getItem(`apticode_user_name_${email.trim()}`) || localStorage.getItem(`signup_fullname_${email.trim()}`) : null;
    raw = saved || (email ? email.split('@')[0] : 'User');
  }
  const match = raw.match(/[a-zA-Z]/);
  return match ? match[0].toUpperCase() : 'A';
}

export function formatHumanName(rawName?: string, email?: string): string {
  let name = rawName?.trim();
  if (name && name !== 'New Candidate' && name !== 'Candidate' && !name.includes('@')) {
    return name;
  }
  if (email) {
    const savedSignupName = localStorage.getItem(`signup_fullname_${email.trim()}`) || localStorage.getItem(`apticode_user_name_${email.trim()}`);
    if (savedSignupName && savedSignupName.trim()) {
      return savedSignupName.trim();
    }
    const handle = email.split('@')[0];
    return handle.charAt(0).toUpperCase() + handle.slice(1);
  }
  return 'Candidate';
}
