'use client';

import { FormEvent, useMemo, useState } from 'react';
import { contactInfo } from '@/data/contact';

type ContactMailtoFormProps = {
  variant?: 'home' | 'page';
};

type PageSubjectOption = {
  value: string;
  label: string;
};

const PAGE_SUBJECT_OPTIONS: PageSubjectOption[] = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'products', label: 'Product Information' },
  { value: 'custom', label: 'Custom Orders' },
  { value: 'wholesale', label: 'Wholesale / Trade' },
  { value: 'press', label: 'Press / Media' },
  { value: 'other', label: 'Other' },
];

export default function ContactMailtoForm({ variant = 'home' }: ContactMailtoFormProps) {
  const isPageVariant = variant === 'page';

  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState(isPageVariant ? '' : 'Product Inquiry');
  const [message, setMessage] = useState('');

  const resolvedName = useMemo(() => {
    if (!isPageVariant) return name.trim();
    return [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
  }, [firstName, isPageVariant, lastName, name]);

  const openMailClient = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const finalSubject = subject.trim() || 'Website Inquiry';
    const body = [
      `Name: ${resolvedName || 'N/A'}`,
      `Email: ${email.trim() || 'N/A'}`,
      phone.trim() ? `Phone: ${phone.trim()}` : null,
      '',
      'Message:',
      message.trim(),
    ]
      .filter(Boolean)
      .join('\n');

    const mailtoUrl = `mailto:${contactInfo.email[0]}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <form className="space-y-6" onSubmit={openMailClient}>
      {isPageVariant ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-stone-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-stone-400 focus:ring-0 outline-none transition-colors"
              placeholder="John"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-stone-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              required
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-stone-400 focus:ring-0 outline-none transition-colors"
              placeholder="Doe"
            />
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-stone-400 focus:ring-0 outline-none transition-colors"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-stone-400 focus:ring-0 outline-none transition-colors"
              placeholder="john@example.com"
            />
          </div>
        </div>
      )}

      {isPageVariant && (
        <div>
          <label htmlFor="emailPage" className="block text-sm font-medium text-stone-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            id="emailPage"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-stone-400 focus:ring-0 outline-none transition-colors"
            placeholder="john@example.com"
          />
        </div>
      )}

      {isPageVariant && (
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-stone-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-stone-400 focus:ring-0 outline-none transition-colors"
            placeholder="+84 776 105 959"
          />
        </div>
      )}

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-stone-700 mb-2">
          Subject{isPageVariant ? ' *' : ''}
        </label>
        {isPageVariant ? (
          <select
            id="subject"
            required
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-stone-400 focus:ring-0 outline-none transition-colors"
          >
            <option value="">Select a subject</option>
            {PAGE_SUBJECT_OPTIONS.map((option) => (
              <option key={option.value} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            id="subject"
            required
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-stone-400 focus:ring-0 outline-none transition-colors"
            placeholder="Product Inquiry"
          />
        )}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-stone-700 mb-2">
          Message{isPageVariant ? ' *' : ''}
        </label>
        <textarea
          id="message"
          rows={isPageVariant ? 6 : 5}
          required
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-stone-400 focus:ring-0 outline-none transition-colors resize-none"
          placeholder={isPageVariant ? 'How can we help you?' : 'Tell us about your project...'}
        />
      </div>

      <button
        type="submit"
        className={isPageVariant
          ? 'w-full px-8 py-4 bg-green-800 text-white font-medium tracking-wide hover:bg-green-900 transition-colors'
          : 'w-full px-8 py-4 bg-stone-800 text-white font-medium tracking-wide hover:bg-stone-900 transition-colors duration-300'}
      >
        Send Message
      </button>

      {isPageVariant && (
        <p className="text-xs text-stone-500 text-center">
          Clicking this button opens the visitor&apos;s email app and prepares the message for sending.
        </p>
      )}
    </form>
  );
}
