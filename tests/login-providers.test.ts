/**
 * login-providers.test.ts — los proveedores de login son puros (arman URL/headers/body sin fetch),
 * así que se prueban sin DOM ni red. Garantiza que:
 *   - el proveedor por defecto (orquestador) conserva el contrato actual (password "wrapeada",
 *     semail sin dominio @contapyme),
 *   - el proveedor PatyIA (portal-login) manda la password en claro y `semail` con dominio,
 *   - `resolveLoginProvider` cae al por defecto ante un id desconocido.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  proveedorOrquestador,
  proveedorPatyiaPortal,
  resolveLoginProvider,
} from '../dist/cdn/js/core/login-providers.js';

const base = 'http://127.0.0.1:8802/api';
const creds = { username: 'jagudeloe@contapyme.com', password: 'secreto' };

test('orquestador (default): password wrapped y semail sin dominio', () => {
  const req = proveedorOrquestador({
    base,
    ...creds,
    opts: { loginKind: 'portal', loginPath: '/auth/token', appId: 'isa-patyia' },
  });
  assert.equal(req.endpoint, `${base}/auth/token`);
  assert.notEqual(req.body.password, 'secreto'); // wrapeada (nunca viaja en claro)
  assert.equal(req.body.semail, 'jagudeloe'); // el dominio no aporta
  assert.equal(req.body.app, 'isa-patyia');
});

test('patyia-portal: password en claro y /auth/portal-login', () => {
  const req = proveedorPatyiaPortal({
    base,
    ...creds,
    opts: { loginPath: '/auth/portal-login', appId: 'isa-patyia' },
  });
  assert.equal(req.endpoint, `${base}/auth/portal-login`);
  assert.equal(req.body.password, 'secreto'); // el server hace md5 (passwordForDs)
  assert.equal(req.body.semail, 'jagudeloe@contapyme.com'); // con dominio
  assert.equal(req.headers['X-App-Id'], 'isa-patyia');
});

test('resolveLoginProvider: patyia-portal resuelve; desconocido cae a orquestador', () => {
  assert.equal(resolveLoginProvider('patyia-portal'), proveedorPatyiaPortal);
  assert.equal(resolveLoginProvider('orquestador'), proveedorOrquestador);
  assert.equal(resolveLoginProvider('algo-raro'), proveedorOrquestador);
  assert.equal(resolveLoginProvider(null), proveedorOrquestador);
});
