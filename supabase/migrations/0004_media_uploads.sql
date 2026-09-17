-- ============================================================
-- HALLOWMARSH: media uploads
-- The 'media' bucket itself is created in 0001_phase1.sql. These policies
-- decide who may put objects in it. Public buckets already serve public URLs,
-- so the read policy only formalizes API reads.
-- ============================================================

-- Anyone can fetch an uploaded image by URL (the bucket is public).
drop policy if exists media_read on storage.objects;
create policy media_read on storage.objects for select
  using (bucket_id = 'media');

-- Only the owner may upload, replace, or delete images. Folder prefixes keep
-- namespaced objects tidy: projects/<uuid>.<ext>
drop policy if exists media_write on storage.objects;
create policy media_write on storage.objects for insert
  with check (bucket_id = 'media' and public.has_role(auth.uid(), 100));

drop policy if exists media_update on storage.objects;
create policy media_update on storage.objects for update
  using (bucket_id = 'media' and public.has_role(auth.uid(), 100))
  with check (bucket_id = 'media' and public.has_role(auth.uid(), 100));

drop policy if exists media_delete on storage.objects;
create policy media_delete on storage.objects for delete
  using (bucket_id = 'media' and public.has_role(auth.uid(), 100));
