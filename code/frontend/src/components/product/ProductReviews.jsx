import { useState, useEffect } from "react";
import { fetchProductReviews } from "../../api/reviews.js";
import { createReview } from "../../api/reviews.js";
import { extractErrorMessage } from "../../utils/apiError.js";

const emptyReviewForm = { author_name: "", rating: 5, comment: "" };

export default function ProductReviews({ productId, productSlug }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyReviewForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchProductReviews(productSlug)
      .then((data) => setReviews(data.results ?? data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productSlug]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createReview({ product_id: productId, ...form });
      setForm(emptyReviewForm);
      setSubmitted(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-10 border-t border-black/10 pt-8">
      <h2 className="text-lg font-bold text-ink">Avis clients</h2>

      {!loading && reviews.length === 0 && (
        <p className="mt-3 text-sm text-muted">Aucun avis pour le moment. Soyez le premier à donner votre avis.</p>
      )}

      {reviews.length > 0 && (
        <ul className="mt-4 space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-lg border border-black/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">{review.author_name}</p>
                <span className="shrink-0 text-sm tracking-[1px] text-brand" aria-hidden="true">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </span>
              </div>
              {review.comment && <p className="mt-2 text-sm text-muted">{review.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="mt-6 max-w-md rounded-[10px] bg-surface p-4">
        <p className="text-sm font-semibold text-ink">Laisser un avis</p>
        {submitted && (
          <p role="status" aria-live="polite" className="mt-2 text-sm text-green-700">
            Merci ! Votre avis sera visible après validation.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="mt-3 flex flex-col gap-3">
          <label htmlFor="review-author" className="text-sm font-semibold text-ink">
            Votre nom
          </label>
          <input
            id="review-author"
            type="text"
            placeholder="Ex. : Jean B."
            required
            value={form.author_name}
            onChange={(e) => setForm({ ...form, author_name: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <label htmlFor="review-rating" className="text-sm font-semibold text-ink">
            Votre note
          </label>
          <select
            id="review-rating"
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {"★".repeat(value)} ({value}/5)
              </option>
            ))}
          </select>
          <label htmlFor="review-comment" className="text-sm font-semibold text-ink">
            Votre commentaire <span className="font-normal text-muted">(optionnel)</span>
          </label>
          <textarea
            id="review-comment"
            placeholder="Votre retour sur ce produit…"
            rows={3}
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-fit rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? "Envoi…" : "Envoyer mon avis"}
          </button>
        </div>
      </form>
    </section>
  );
}
