"""
Centralized Notification Engine
─────────────────────────────────
Supports Push, WhatsApp, SMS, and Email channels.
Uses stub implementations designed for drop-in replacement
with real providers (Twilio, SendGrid, FCM, etc.).
"""
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from enum import Enum

logger = logging.getLogger(__name__)


class NotificationChannel(str, Enum):
    PUSH = "push"
    SMS = "sms"
    WHATSAPP = "whatsapp"
    EMAIL = "email"


class NotificationStatus(str, Enum):
    QUEUED = "queued"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"


class NotificationEngine:
    """
    Centralized notification service with retry queue.
    All send methods are stubs that log the notification — replace
    with real provider SDKs (Twilio, FCM, SendGrid) for production.
    """

    MAX_RETRIES = 3

    def __init__(self):
        self._history: List[Dict[str, Any]] = []
        self._retry_queue: List[Dict[str, Any]] = []

    # ── Public API ───────────────────────────────────────────────────
    async def send(
        self,
        channel: NotificationChannel,
        recipient: str,
        message: str,
        subject: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Route a notification to the appropriate channel handler.

        Args:
            channel: The delivery channel.
            recipient: Phone number, email, or user ID.
            message: The notification body.
            subject: Email subject (only for email channel).
            metadata: Additional data to attach.

        Returns:
            Notification record with status.
        """
        record = {
            "id": str(uuid.uuid4()),
            "channel": channel.value,
            "recipient": recipient,
            "message": message,
            "subject": subject,
            "metadata": metadata,
            "status": NotificationStatus.QUEUED.value,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "attempts": 0,
        }

        handlers = {
            NotificationChannel.PUSH: self._send_push,
            NotificationChannel.SMS: self._send_sms,
            NotificationChannel.WHATSAPP: self._send_whatsapp,
            NotificationChannel.EMAIL: self._send_email,
        }

        handler = handlers.get(channel, self._send_push)

        try:
            success = await handler(recipient, message, subject)
            record["status"] = NotificationStatus.SENT.value if success else NotificationStatus.FAILED.value
            record["attempts"] = 1
        except Exception as exc:
            logger.error("Notification send failed [%s → %s]: %s", channel.value, recipient, exc)
            record["status"] = NotificationStatus.FAILED.value
            record["attempts"] = 1
            self._retry_queue.append(record)

        self._history.append(record)
        return record

    async def send_push(self, user_id: str, message: str) -> Dict[str, Any]:
        """Convenience: send a push notification."""
        return await self.send(NotificationChannel.PUSH, user_id, message)

    async def send_sms(self, phone: str, message: str) -> Dict[str, Any]:
        """Convenience: send an SMS."""
        return await self.send(NotificationChannel.SMS, phone, message)

    async def send_whatsapp(self, phone: str, message: str) -> Dict[str, Any]:
        """Convenience: send a WhatsApp message."""
        return await self.send(NotificationChannel.WHATSAPP, phone, message)

    async def send_email(self, email: str, subject: str, body: str) -> Dict[str, Any]:
        """Convenience: send an email."""
        return await self.send(NotificationChannel.EMAIL, email, body, subject=subject)

    def get_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent notification history."""
        return self._history[-limit:]

    def get_retry_queue(self) -> List[Dict[str, Any]]:
        """Get pending retries."""
        return list(self._retry_queue)

    # ── Channel handlers (stubs) ─────────────────────────────────────
    async def _send_push(self, user_id: str, message: str, subject: Optional[str] = None) -> bool:
        """Stub: Push notification via FCM or APNs."""
        logger.info("[PUSH STUB] → %s: %s", user_id, message[:100])
        return True

    async def _send_sms(self, phone: str, message: str, subject: Optional[str] = None) -> bool:
        """Stub: SMS via Twilio or similar."""
        logger.info("[SMS STUB] → %s: %s", phone, message[:100])
        return True

    async def _send_whatsapp(self, phone: str, message: str, subject: Optional[str] = None) -> bool:
        """Stub: WhatsApp via Twilio/Meta Business API."""
        logger.info("[WHATSAPP STUB] → %s: %s", phone, message[:100])
        return True

    async def _send_email(self, email: str, message: str, subject: Optional[str] = None) -> bool:
        """Stub: Email via SendGrid or SMTP."""
        logger.info("[EMAIL STUB] → %s (subject: %s): %s", email, subject, message[:100])
        return True


# Module-level singleton
notification_engine = NotificationEngine()
