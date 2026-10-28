ALTER TABLE certificate_requests
  DROP CONSTRAINT IF EXISTS certificate_requests_state_check;

ALTER TABLE certificate_requests
  ADD CONSTRAINT certificate_requests_state_check CHECK (state IN (
    'created', 'authenticating_request', 'querying_issuer', 'certificate_received',
    'verifying_signature', 'checking_current_status', 'storing_document', 'completed',
    'no_match', 'issuer_unavailable', 'integrity_failed', 'signature_invalid', 'status_check_failed',
    'certificate_revoked', 'certificate_superseded', 'storage_failed', 'internal_error'
  ));
