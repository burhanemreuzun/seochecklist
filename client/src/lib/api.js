/** İnce API istemcisi. Hata mesajlarını sunucudan olduğu gibi taşır. */

/** Oturum düştüğünde tetiklenir; yönlendirici giriş ekranına atar. */
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && !path.startsWith('/auth')) {
    onUnauthorized();
    throw new Error('Oturumun sona erdi, tekrar giriş yap.');
  }
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Sunucu hatası (${res.status})`);
  return data;
}

export const api = {
  health:     ()             => request('/health'),

  me:         ()             => request('/auth/me'),
  login:      (password)     => request('/auth/login', { method: 'POST', body: { password } }),
  logout:     ()             => request('/auth/logout', { method: 'POST' }),

  /** list: 'audit' (varsayılan) ya da 'write' */
  checklist:  (list = 'audit') => request(`/checklist?list=${encodeURIComponent(list)}`),

  listPosts:  (params = {})  => request(`/posts?${new URLSearchParams(params)}`),
  getPost:    (id)           => request(`/posts/${id}`),
  createPost: (body)         => request('/posts', { method: 'POST', body }),
  updatePost: (id, body)     => request(`/posts/${id}`, { method: 'PATCH', body }),
  deletePost: (id)           => request(`/posts/${id}`, { method: 'DELETE' }),

  setCheck:   (id, code, body) => request(`/posts/${id}/checks/${code}`, { method: 'PUT', body }),
  auditPost:  (id, body = {}) => request(`/posts/${id}/audit`, { method: 'POST', body }),
  auditUrl:   (body)         => request('/audit', { method: 'POST', body }),
  auditHistory: (id)         => request(`/posts/${id}/audits`),
};

/** Editör adı tarayıcıda saklanır; ayrı bir giriş ekranına gerek yok. */
const EDITOR_KEY = 'seochecklist.editor';
export const editorName = {
  get: () => { try { return localStorage.getItem(EDITOR_KEY) || ''; } catch { return ''; } },
  set: (v) => { try { localStorage.setItem(EDITOR_KEY, v); } catch { /* yok say */ } },
};
