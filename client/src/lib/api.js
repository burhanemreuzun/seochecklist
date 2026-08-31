/** Ince API istemcisi. Hata mesajlarini sunucudan oldugu gibi tasir. */
async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Sunucu hatasi (${res.status})`);
  return data;
}

export const api = {
  health:     ()             => request('/health'),
  checklist:  ()             => request('/checklist'),

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

/** Editor adi tarayicida saklanir - ayri bir giris ekranina gerek yok. */
const EDITOR_KEY = 'seochecklist.editor';
export const editorName = {
  get: () => { try { return localStorage.getItem(EDITOR_KEY) || ''; } catch { return ''; } },
  set: (v) => { try { localStorage.setItem(EDITOR_KEY, v); } catch { /* yok say */ } },
};
