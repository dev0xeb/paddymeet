-- 007: allows signed-in users to upload chat photos/videos.
--
-- The `chat-media` storage bucket exists and is marked public (so reading
-- an uploaded file via its public URL already works), but Supabase Storage
-- enforces RLS on storage.objects independently of the bucket's public
-- flag — "public" only affects reads, not writes. No policy was ever
-- created allowing writes, so every upload attempt from
-- lib/chatMedia.ts (used by both the event chat and the group chat
-- attachment feature) has been failing with "new row violates row-level
-- security policy".

CREATE POLICY "Authenticated users can upload chat media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-media');

CREATE POLICY "Anyone can view chat media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-media');
