import { ApiError } from '@/lib/api-client/base/BaseApiClient';
import { getUserErrorMessage } from '@/lib/utils/user-error-message';

describe('getUserErrorMessage', () => {
  it('maps auth errors to a friendly session message', () => {
    const result = getUserErrorMessage(new ApiError('Not authenticated', 401), 'action');
    expect(result.title).toBe('No se pudo completar');
    expect(result.message).toContain('Inicia sesión');
  });

  it('maps network failures to a friendly connectivity message', () => {
    const result = getUserErrorMessage(
      new Error('Network request failed'),
      'fetch'
    );
    expect(result.title).toBe('No se pudo cargar');
    expect(result.message).toContain('conexión');
  });

  it('passes through readable API validation messages', () => {
    const result = getUserErrorMessage(
      new ApiError('La referencia ya fue registrada.', 409, 'conflict'),
      'action'
    );
    expect(result.message).toBe('La referencia ya fue registrada.');
  });

  it('hides technical request failure strings', () => {
    const result = getUserErrorMessage(new ApiError('Request failed (500)', 500), 'fetch');
    expect(result.message).not.toContain('Request failed');
    expect(result.message).toContain('error interno');
  });

  it('shows readable server error messages for HTTP 500', () => {
    const result = getUserErrorMessage(
      new ApiError('Error interno del servidor', 500),
      'action'
    );
    expect(result.message).toBe('Error interno del servidor');
  });

  it('uses context-specific fallbacks', () => {
    const result = getUserErrorMessage(null, 'fetch', 'Could not load apps');
    expect(result.message).toContain('apps instaladas');
  });
});
