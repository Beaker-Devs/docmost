jest.mock('./audit.service', () => ({ AuditService: class {} }));

import { of } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';

function makeContext(req: any) {
  return {
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => req }),
  } as any;
}

function run(interceptor: AuditInterceptor, req: any, response: any = { id: 'r1' }) {
  const next = { handle: () => of(response) } as any;
  // subscribe synchronously so the tap fires
  interceptor.intercept(makeContext(req), next).subscribe();
}

const licensedWorkspace = { id: 'w1', licenseKey: 'LIC' };
const user = { id: 'u1' };

function req(overrides: any = {}) {
  return {
    method: 'POST',
    url: '/api/pages/create',
    user: { user },
    raw: { workspace: licensedWorkspace },
    body: {},
    headers: { 'user-agent': 'jest' },
    ip: '10.0.0.1',
    ...overrides,
  };
}

describe('AuditInterceptor', () => {
  let service: { record: jest.Mock };
  let interceptor: AuditInterceptor;

  beforeEach(() => {
    service = { record: jest.fn().mockResolvedValue(undefined) };
    interceptor = new AuditInterceptor(service as any);
  });

  it('records an allowlisted, authenticated, licensed mutation', () => {
    run(interceptor, req({ body: { title: 'Hello' } }), { id: 'page-1' });
    expect(service.record).toHaveBeenCalledTimes(1);
    const entry = service.record.mock.calls[0][0];
    expect(entry).toMatchObject({
      workspaceId: 'w1',
      userId: 'u1',
      action: 'page.create',
      resourceType: 'page',
      resourceId: 'page-1',
    });
    expect(entry.detail).toEqual({ title: 'Hello' });
    expect(entry.ipAddress).toBe('10.0.0.1');
  });

  it('redacts unsafe fields (keeps whitelist, drops secrets)', () => {
    run(interceptor, req({ body: { title: 'X', password: 'secret', token: 'abc' } }));
    const entry = service.record.mock.calls[0][0];
    expect(entry.detail).toEqual({ title: 'X' });
    expect(entry.detail.password).toBeUndefined();
    expect(entry.detail.token).toBeUndefined();
  });

  it('does not record a read / non-allowlisted route', () => {
    run(interceptor, req({ url: '/api/pages/info' }));
    expect(service.record).not.toHaveBeenCalled();
  });

  it('does not record non-POST requests', () => {
    run(interceptor, req({ method: 'GET' }));
    expect(service.record).not.toHaveBeenCalled();
  });

  it('does not record without an authenticated user', () => {
    run(interceptor, req({ user: undefined }));
    expect(service.record).not.toHaveBeenCalled();
  });

  it('records regardless of license (available on install)', () => {
    run(interceptor, req({ raw: { workspace: { id: 'w1', licenseKey: null } } }));
    expect(service.record).toHaveBeenCalledTimes(1);
  });

  it('prefers the resourceId field from the body when present', () => {
    run(
      interceptor,
      req({ url: '/api/pages/delete', body: { pageId: 'p-99' } }),
      undefined,
    );
    const entry = service.record.mock.calls[0][0];
    expect(entry.action).toBe('page.delete');
    expect(entry.resourceId).toBe('p-99');
  });

  it('strips query strings when matching the route', () => {
    run(interceptor, req({ url: '/api/pages/create?foo=bar', body: { title: 'Q' } }));
    expect(service.record).toHaveBeenCalledTimes(1);
  });
});
