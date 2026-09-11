export function normalizePhone(phone) {
  return (phone || '').replace(/\D/g, '');
}

export function getInstallLink(emp, origin) {
  const base = String(origin || window.location.origin).replace(/\/+$/, '');
  return `${base}/install?employee=${encodeURIComponent(emp.id)}&name=${encodeURIComponent(emp.name)}`;
}

export function buildWhatsAppMessage(emp, origin) {
  const link = getInstallLink(emp, origin);
  const digits = normalizePhone(emp.phone);
  return (
    `Hi ${emp.name}! Welcome to Attendo.\n\n` +
    `Your employee account has been created (Employee ID: ${emp.id.toUpperCase()}).\n\n` +
    `Download and install the Attendo app using your personalized link:\n${link}\n\n` +
    `If the number ${digits || 'above'} is your WhatsApp account, tap Send and the app link will come through instantly.\n\nThank you!`
  );
}

export function buildWhatsAppUrl(emp, origin) {
  const digits = normalizePhone(emp.phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(buildWhatsAppMessage(emp, origin))}`;
}

export function sendAppDownloadLink(emp, origin) {
  const url = buildWhatsAppUrl(emp, origin);
  if (!url) return null;
  window.open(url, '_blank');
  return url;
}