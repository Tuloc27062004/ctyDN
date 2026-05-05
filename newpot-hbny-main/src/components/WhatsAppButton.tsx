'use client';

import { FaWhatsapp } from 'react-icons/fa';
import { contactInfo } from '@/data/contact';

export default function WhatsAppButton({
  className,
}: {
  className?: string;
}) {
  const whatsappNumber = contactInfo.phone[0].replace(/\D/g, '');

  return (
    <a
      href={`https://wa.me/${whatsappNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on WhatsApp"
      title="Contact us on WhatsApp"
      className={`inline-flex items-center gap-2 px-3 py-3 bg-green-600 text-white rounded-4xl hover:bg-green-700 transition ${className || ''}`}
    >
      <FaWhatsapp className="w-10 h-10" />
      {/* Contact on WhatsApp */}
    </a>
  );
}
