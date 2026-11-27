// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { FeedbackDialog } from '../../../components/feedback/FeedbackDialog';

afterEach(cleanup);

describe('FeedbackDialog', () => {
  it('sends the chosen category with the trimmed message, then thanks the user', async () => {
    const send = vi.fn().mockResolvedValue('sent');
    const onClose = vi.fn();
    const view = render(<FeedbackDialog appVersion="2.2.0" onClose={onClose} send={send} />);
    const textarea = view.getByRole('textbox', { name: 'Ton message' });
    const submit = view.getByRole('button', { name: 'Envoyer' }) as HTMLButtonElement;
    expect(document.activeElement).toBe(textarea);
    expect(submit.disabled).toBe(true);
    fireEvent.click(view.getByRole('radio', { name: 'Bug' }));
    fireEvent.change(textarea, { target: { value: '  Le score saute  ' } });
    expect(view.getByText('18 / 5000')).toBeTruthy();
    fireEvent.click(submit);
    await waitFor(() => expect(view.getByRole('status').textContent).toBe('Merci ! Ton message a bien été envoyé.'));
    expect(send).toHaveBeenCalledWith({ category: 'bug', message: 'Le score saute', app_version: '2.2.0' });
    fireEvent.click(view.getAllByRole('button', { name: 'Fermer' }).at(-1)!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('keeps the message after a failure, explains why and closes with Escape', async () => {
    const send = vi.fn()
      .mockResolvedValueOnce('rate-limited')
      .mockResolvedValueOnce('invalid')
      .mockResolvedValueOnce('error');
    const onClose = vi.fn();
    const view = render(<FeedbackDialog appVersion="2.2.0" onClose={onClose} send={send} />);
    const textarea = view.getByRole('textbox', { name: 'Ton message' }) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Super appli' } });
    fireEvent.click(view.getByRole('button', { name: 'Envoyer' }));
    await waitFor(() => expect(view.getByRole('alert').textContent).toBe('Trop de messages envoyés. Réessaie plus tard.'));
    fireEvent.click(view.getByRole('button', { name: 'Envoyer' }));
    await waitFor(() => expect(view.getByRole('alert').textContent).toBe('Message refusé : vérifie son contenu.'));
    fireEvent.click(view.getByRole('button', { name: 'Envoyer' }));
    await waitFor(() => expect(view.getByRole('alert').textContent).toContain('n’a pas pu être envoyé'));
    expect(textarea.value).toBe('Super appli');
    fireEvent.change(textarea, { target: { value: 'Super appli !' } });
    expect(view.queryByRole('alert')).toBeNull();
    fireEvent.keyDown(view.getByTestId('feedback-dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('ignores closing while a message is being sent', async () => {
    let resolve: (value: 'sent') => void = () => {};
    const send = vi.fn(() => new Promise<'sent'>((done) => { resolve = done; }));
    const onClose = vi.fn();
    const view = render(<FeedbackDialog appVersion="2.2.0" onClose={onClose} send={send} />);
    fireEvent.change(view.getByRole('textbox', { name: 'Ton message' }), { target: { value: 'Une idée' } });
    fireEvent.click(view.getByRole('button', { name: 'Envoyer' }));
    expect(view.getByRole('button', { name: 'Envoi…' })).toBeTruthy();
    fireEvent.keyDown(view.getByTestId('feedback-dialog'), { key: 'Escape' });
    fireEvent.click(view.getByRole('button', { name: 'Fermer le message' }));
    expect(onClose).not.toHaveBeenCalled();
    resolve('sent');
    await waitFor(() => expect(view.getByRole('status')).toBeTruthy());
  });
});
