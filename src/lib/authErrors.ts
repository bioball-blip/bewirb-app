export function translateAuthError(message: string): string {
  if (message.includes('already registered')) {
    return 'Diese E-Mail-Adresse ist bereits registriert.'
  }
  if (message.includes('Password should be at least')) {
    return 'Das Passwort muss mindestens 6 Zeichen lang sein.'
  }
  if (
    message.includes('Unable to validate email') ||
    message.includes('is invalid')
  ) {
    return 'Diese E-Mail-Adresse ist ungültig.'
  }
  if (message.includes('Invalid login credentials')) {
    return 'E-Mail oder Passwort ist falsch.'
  }
  if (message.includes('Email not confirmed')) {
    return 'Bitte bestätige zuerst deine E-Mail-Adresse über den Link, den wir dir geschickt haben.'
  }
  return message
}
