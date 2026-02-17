
-- Make notifications insert more restrictive - only allow inserting notifications for authenticated users
DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
