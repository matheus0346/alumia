export class ApiError extends Error {
  constructor(status, code, errors = {}) {
    const messages = {
      unauthenticated: 'Entre novamente para continuar.',
      session_revoked: 'Seu acesso foi atualizado. Entre novamente.',
      access_suspended: 'O acesso está suspenso. Procure o responsável pela escola.',
      password_change_required: 'Troque a senha temporária para continuar.',
      forbidden: 'Seu perfil não tem acesso a esta ação.',
      period_closed: 'O período de avaliação não está aberto. O texto não foi enviado.',
      already_submitted: 'Seu texto deste período já foi enviado.',
      save_failed: 'Não foi possível salvar. Seu texto NÃO foi enviado; tente novamente em instantes.',
      network: 'Não foi possível confirmar a operação. Verifique a conexão e atualize os dados antes de repetir.',
      unavailable: 'O serviço está indisponível no momento. Tente novamente em instantes.',
    };
    const validation = status === 422 && Object.values(errors).flat().find((v) => typeof v === 'string');
    super(validation || messages[code] || (status === 429 ? 'Muitas tentativas. Aguarde um minuto antes de tentar novamente.' : status === 419 ? 'A sessão de segurança expirou. Atualize a página.' : 'Não foi possível concluir a operação.'));
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

export function createApiClient(fetcher = (...args) => globalThis.fetch(...args)) {
  let csrf = null;
  let pendingCsrf = null;

  async function send(path, method, body, token, signal) {
    let response;
    try {
      response = await fetcher(path, {
        method, credentials: 'same-origin', cache: 'no-store', signal,
        headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { 'X-CSRF-TOKEN': token } : {}) },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      throw new ApiError(0, 'network');
    }
    let data = null;
    if (response.status !== 204) {
      try { data = await response.json(); } catch { throw new ApiError(response.status, 'unavailable'); }
    }
    return { response, data };
  }

  async function csrfToken() {
    if (csrf) return csrf;
    if (!pendingCsrf) {
      pendingCsrf = send('/api/v1/auth/csrf', 'GET').then(({ response, data }) => {
        if (!response.ok || typeof data?.csrf_token !== 'string') throw new ApiError(response.status, 'unavailable');
        csrf = data.csrf_token;
        return csrf;
      }).finally(() => { pendingCsrf = null; });
    }
    return pendingCsrf;
  }

  async function request(path, { method = 'GET', body, signal } = {}) {
    if (!path.startsWith('/api/v1/') || path.includes('://')) throw new Error('Only same-origin API paths are allowed.');
    const mutates = !['GET', 'HEAD'].includes(method);
    let result = await send(path, method, body, mutates ? await csrfToken() : null, signal);
    // Retry only an explicit CSRF rejection: the server has not executed the action.
    if (mutates && result.response.status === 419) {
      csrf = null;
      result = await send(path, method, body, await csrfToken(), signal);
    }
    if (!result.response.ok) throw new ApiError(result.response.status, result.data?.error || (result.response.status >= 500 ? 'unavailable' : 'request_failed'), result.data?.errors || {});
    if (mutates && ['/api/v1/auth/institution/login', '/api/v1/auth/student/login', '/api/v1/auth/password', '/api/v1/auth/logout'].includes(path)) csrf = null;
    return result.data;
  }
  return { request };
}

export const api = createApiClient();
