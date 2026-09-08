import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app';
import { memoryDb } from '@prosumate/database';

describe('Forms & Lead Capture Suite', () => {
  const app = buildApp();

  let tokenUserA: string;
  let tokenUserB: string;
  let locationAId: string;

  beforeEach(async () => {
    memoryDb.clear();

    const regA = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'form-a@agency.com',
        password: 'Password123!',
        firstName: 'Form',
        lastName: 'Admin A',
        agencyName: 'Form Agency A',
        initialLocationName: 'Form Loc A',
      },
    });
    tokenUserA = regA.json().data.tokens.accessToken;
    locationAId = regA.json().data.location.id;

    const regB = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'form-b@agency.com',
        password: 'Password123!',
        firstName: 'Form',
        lastName: 'Admin B',
        agencyName: 'Form Agency B',
        initialLocationName: 'Form Loc B',
      },
    });
    tokenUserB = regB.json().data.tokens.accessToken;
  });

  test('Creates form, submits via public endpoint, auto-creates contact', async () => {
    // 1. Create form
    const formRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/forms`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'Contact Us Form',
        slug: 'contact-us',
        fields: [
          { label: 'First Name', type: 'text', required: true },
          { label: 'Last Name', type: 'text', required: true },
          { label: 'Email', type: 'email', required: true },
          { label: 'Message', type: 'textarea' },
        ],
        submitAction: 'create_contact',
        thankYouMessage: 'We received your inquiry. Expect a response within 24 hours.',
      },
    });

    assert.equal(formRes.statusCode, 201);
    const form = formRes.json().data;
    assert.equal(form.fields.length, 4);

    // 2. Submit form via PUBLIC endpoint (no auth)
    const submitRes = await app.inject({
      method: 'POST',
      url: `/api/v1/public/forms/${form.slug}/submit`,
      payload: {
        data: {
          firstName: 'James',
          lastName: 'Webb',
          email: 'jwebb@telescope.space',
          Message: 'Interested in your enterprise CRM platform.',
        },
      },
    });

    assert.equal(submitRes.statusCode, 201);
    const submitBody = submitRes.json();
    assert.ok(submitBody.data.contactId); // auto-created contact
    assert.equal(submitBody.data.message, 'We received your inquiry. Expect a response within 24 hours.');

    // 3. Verify contact was auto-created with correct source
    const contactsRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/contacts?search=jwebb`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(contactsRes.statusCode, 200);
    const contacts = contactsRes.json().data;
    assert.equal(contacts.length, 1);
    assert.equal(contacts[0].source, 'form:contact-us');
    assert.ok(contacts[0].tags.includes('Form Submission'));
  });

  test('Duplicate form submission links to existing contact instead of creating new one', async () => {
    // Create form
    const formRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/forms`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'Newsletter Signup',
        slug: 'newsletter',
        fields: [
          { label: 'Email', type: 'email', required: true },
          { label: 'First Name', type: 'text' },
          { label: 'Last Name', type: 'text' },
        ],
      },
    });
    const form = formRes.json().data;

    // First submission
    const sub1 = await app.inject({
      method: 'POST',
      url: `/api/v1/public/forms/${form.slug}/submit`,
      payload: {
        data: { email: 'repeat@visitor.com', firstName: 'Repeat', lastName: 'Visitor' },
      },
    });
    const contactId1 = sub1.json().data.contactId;

    // Second submission with same email — should link to existing contact
    const sub2 = await app.inject({
      method: 'POST',
      url: `/api/v1/public/forms/${form.slug}/submit`,
      payload: {
        data: { email: 'repeat@visitor.com', firstName: 'Repeat', lastName: 'Visitor' },
      },
    });
    const contactId2 = sub2.json().data.contactId;

    assert.equal(contactId1, contactId2); // Same contact linked, not duplicated

    // Verify submissions count
    const subsRes = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/forms/${form.id}/submissions`,
      headers: { authorization: `Bearer ${tokenUserA}` },
    });
    assert.equal(subsRes.json().data.length, 2);
  });

  test('Cross-tenant: User B cannot list Location A forms or submissions', async () => {
    const formRes = await app.inject({
      method: 'POST',
      url: `/api/v1/locations/${locationAId}/forms`,
      headers: { authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: 'Secret Internal Form',
        slug: 'secret-form',
        fields: [{ label: 'Name', type: 'text', required: true }],
      },
    });

    const crossList = await app.inject({
      method: 'GET',
      url: `/api/v1/locations/${locationAId}/forms`,
      headers: { authorization: `Bearer ${tokenUserB}` },
    });
    assert.equal(crossList.statusCode, 403);
    assert.equal(crossList.json().error.code, 'FORBIDDEN');
  });
});
