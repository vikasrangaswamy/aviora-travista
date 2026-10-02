// Enquiry form — the only thing on the site that talks to a server.
// Submissions go to Web3Forms (https://web3forms.com), which emails them to the
// address the access key was created with. Set VITE_WEB3FORMS_KEY in .env.

const ENDPOINT = 'https://api.web3forms.com/submit';
const ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_KEY || '';

export function mountEnquiry(slot) {
  if (!slot || slot.dataset.mounted) return;
  const tpl = document.getElementById('enquiry-template');
  slot.appendChild(tpl.content.cloneNode(true));
  slot.dataset.mounted = '1';

  const form = slot.querySelector('form');
  const done = slot.querySelector('.enquiry-done');
  const errorEl = form.querySelector('.form-error');
  const submitBtn = form.querySelector('button[type="submit"]');

  // unique ids so the inline form and the modal form never clash
  const uid = Math.random().toString(36).slice(2, 7);
  form.querySelectorAll('input, select, textarea').forEach((el) => { el.id = `${el.name}-${uid}`; });

  const showError = (msg) => { errorEl.textContent = msg; errorEl.hidden = !msg; };

  form.addEventListener('input', (e) => {
    if (e.target.classList.contains('is-invalid') && e.target.checkValidity()) e.target.classList.remove('is-invalid');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');
    const invalid = [...form.querySelectorAll('input, select, textarea')].filter((el) => !el.checkValidity());
    invalid.forEach((el) => el.classList.add('is-invalid'));
    if (invalid.length) {
      showError('Please add your name and a valid phone number.');
      invalid[0].focus();
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    if (data.botcheck) return; // honeypot filled → silently drop

    if (!ACCESS_KEY) {
      showError('Online enquiries are not connected yet — please call +91 96868 54872 or message us on WhatsApp.');
      console.warn('[enquiry] VITE_WEB3FORMS_KEY is not set. See README.md.');
      return;
    }

    form.classList.add('is-sending');
    submitBtn.disabled = true;
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: `New enquiry — ${data.trip_type} — ${data.name}`,
          from_name: 'Aviora Travista website',
          replyto: data.email || undefined,
          ...data,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) throw new Error(json.message || `HTTP ${res.status}`);
      form.reset();
      form.hidden = true;
      done.hidden = false;
      done.animate?.([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,.7,.2,1)' });
    } catch (err) {
      console.error('[enquiry]', err);
      showError('Something went wrong sending your enquiry. Please try again, or call +91 96868 54872.');
    } finally {
      form.classList.remove('is-sending');
      submitBtn.disabled = false;
    }
  });

  slot.querySelector('[data-reset]').addEventListener('click', () => {
    done.hidden = true;
    form.hidden = false;
    form.querySelector('input[name="name"]').focus();
  });

  return form;
}
