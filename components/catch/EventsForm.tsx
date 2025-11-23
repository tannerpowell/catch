'use client';

import { useState } from 'react';
import styles from './EventsForm.module.css';

type FormType = 'party' | 'catering';

interface EventsFormProps {
  locations: Array<{ slug: string; name: string }>;
}

export default function EventsForm({ locations }: EventsFormProps) {
  const [formType, setFormType] = useState<FormType>('party');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // TODO: Implement actual form submission
    // For now, just simulate a successful submission
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('Form data:', data);
    setIsSubmitting(false);
    setSubmitStatus('success');

    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitStatus('idle');
      (e.target as HTMLFormElement).reset();
    }, 3000);
  };

  return (
    <div className={styles.eventsFormWrapper}>
      {/* Form Type Toggle */}
      <div className={styles.formTypeToggle}>
        <button
          type="button"
          className={`${styles.toggleButton} ${formType === 'party' ? styles.active : ''}`}
          onClick={() => setFormType('party')}
        >
          Private Parties
        </button>
        <button
          type="button"
          className={`${styles.toggleButton} ${formType === 'catering' ? styles.active : ''}`}
          onClick={() => setFormType('catering')}
        >
          Catering
        </button>
      </div>

      {/* Form Header */}
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>
          {formType === 'party' ? 'Plan Your Private Event' : 'Catering Inquiry'}
        </h2>
        <p className={styles.formSubtitle}>
          {formType === 'party'
            ? 'From birthday celebrations to corporate gatherings, we\'ll make your event unforgettable with fresh Gulf-inspired seafood.'
            : 'Bring The Catch experience to your event. Fresh baskets, boils, and Southern hospitality delivered to you.'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className={styles.eventsForm}>
        <input type="hidden" name="eventType" value={formType} />

        {/* Contact Information */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Contact Information</h3>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="firstName" className={styles.formLabel}>
                First Name <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                className={styles.formInput}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="lastName" className={styles.formLabel}>
                Last Name <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                className={styles.formInput}
                required
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.formLabel}>
                Email <span className={styles.required}>*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={styles.formInput}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone" className={styles.formLabel}>
                Phone <span className={styles.required}>*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className={styles.formInput}
                placeholder="(555) 555-5555"
                required
              />
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Event Details</h3>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="eventDate" className={styles.formLabel}>
                Event Date <span className={styles.required}>*</span>
              </label>
              <input
                type="date"
                id="eventDate"
                name="eventDate"
                className={styles.formInput}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="eventTime" className={styles.formLabel}>
                {formType === 'party' ? 'Event Time' : 'Delivery/Pickup Time'} <span className={styles.required}>*</span>
              </label>
              <input
                type="time"
                id="eventTime"
                name="eventTime"
                className={styles.formInput}
                required
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="guestCount" className={styles.formLabel}>
                Number of Guests <span className={styles.required}>*</span>
              </label>
              <select
                id="guestCount"
                name="guestCount"
                className={styles.formInput}
                required
              >
                <option value="">Select guest count</option>
                <option value="10-20">10-20 guests</option>
                <option value="20-30">20-30 guests</option>
                <option value="30-50">30-50 guests</option>
                <option value="50-75">50-75 guests</option>
                <option value="75-100">75-100 guests</option>
                <option value="100+">100+ guests</option>
              </select>
            </div>

            {formType === 'party' && (
              <div className={styles.formGroup}>
                <label htmlFor="eventTypeDetail" className={styles.formLabel}>
                  Event Type
                </label>
                <select
                  id="eventTypeDetail"
                  name="eventTypeDetail"
                  className={styles.formInput}
                >
                  <option value="">Select event type</option>
                  <option value="birthday">Birthday Party</option>
                  <option value="corporate">Corporate Event</option>
                  <option value="wedding">Wedding Reception</option>
                  <option value="graduation">Graduation</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="other">Other Celebration</option>
                </select>
              </div>
            )}

            {formType === 'catering' && (
              <div className={styles.formGroup}>
                <label htmlFor="serviceType" className={styles.formLabel}>
                  Service Type <span className={styles.required}>*</span>
                </label>
                <select
                  id="serviceType"
                  name="serviceType"
                  className={styles.formInput}
                  required
                >
                  <option value="">Select service type</option>
                  <option value="delivery">Delivery</option>
                  <option value="pickup">Pickup</option>
                </select>
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="location" className={styles.formLabel}>
              {formType === 'party' ? 'Preferred Location' : 'Pickup/Serving Location'} <span className={styles.required}>*</span>
            </label>
            <select
              id="location"
              name="location"
              className={styles.formInput}
              required
            >
              <option value="">Select a location</option>
              {locations.map((loc) => (
                <option key={loc.slug} value={loc.slug}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Additional Information */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Additional Information</h3>

          <div className={styles.formGroup}>
            <label htmlFor="message" className={styles.formLabel}>
              Special Requests or Questions
            </label>
            <textarea
              id="message"
              name="message"
              className={styles.formTextarea}
              rows={5}
              placeholder={
                formType === 'party'
                  ? 'Tell us about your event, dietary restrictions, special accommodations, etc.'
                  : 'Menu preferences, dietary restrictions, setup requirements, etc.'
              }
            />
          </div>

          <div className={`${styles.formGroup} ${styles.checkboxGroup}`}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="smsOptIn"
                className={styles.formCheckbox}
              />
              <span className={styles.checkboxText}>
                I'd like to receive text messages about specials, events, and exclusive offers
              </span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className={styles.formActions}>
          {submitStatus === 'success' && (
            <div className={styles.successMessage}>
              Thank you! We'll be in touch shortly to discuss your {formType === 'party' ? 'event' : 'catering needs'}.
            </div>
          )}
          {submitStatus === 'error' && (
            <div className={styles.errorMessage}>
              Something went wrong. Please try again or call us directly.
            </div>
          )}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
          </button>
        </div>
      </form>
    </div>
  );
}
