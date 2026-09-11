import { APP } from "$lib/const/app.const";
import { ERROR } from "$lib/const/error.const";
import type { PaystackTransaction } from "$lib/server/db/models/subscription.model";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { PDF, Standard14Font, StandardFonts, rgb } from "@libpdf/core";
import { captureException } from "@sentry/sveltekit";
import { Format } from "../format.util";

/**
 * Real glyph metrics, not the `length * size * 0.55` estimate this used to
 * carry — @libpdf/core exposes measurement as of 0.4, which the old comment
 * predates.
 *
 * The estimate was not close enough for the two things measured here. It reads
 * "Receipt" at 16pt as 61.6pt against an actual 54.24pt, so every right-aligned
 * string sat ~7pt off its margin; and because `Format.currency` output is
 * neither a fixed width nor a fixed character count (the symbol, the grouping
 * separators and the digits all move), the error grew with the amount.
 *
 * Resolved once at module load: constructing the font is the expensive part,
 * `widthOfTextAtSize` is cheap.
 */
const HELVETICA = Standard14Font.of(StandardFonts.Helvetica);

const measure_text = (text: string, size: number): number =>
  HELVETICA.widthOfTextAtSize(text, size);

/**
 * Generate PDF receipt for Paystack transaction using libpdf's drawing API
 *
 * Creates professional receipt with:
 * - App header as merchant
 * - Transaction details (reference, date, amount, plan)
 * - Payment status confirmation
 *
 * @param input - Transaction data to render
 * @returns Result containing PDF as Uint8Array or error
 */
export async function generate_transaction_pdf(input: {
  transaction: Pick<
    PaystackTransaction,
    "reference" | "amount" | "currency" | "plan" | "status" | "createdAt"
  >;
}): Promise<
  App.Result<{
    buffer: Uint8Array;
    file_name: string;
    file_size: number;
    content_type: string;
  }>
> {
  try {
    // Validate required data
    if (!input.transaction.amount) {
      return result.err({
        ...ERROR.INVALID_INPUT,
        message: "Cannot generate transaction PDF: no amount",
      });
    }

    // Create PDF document with libpdf
    const doc = PDF.create();

    // Add letter-sized page
    const page = doc.addPage({ size: "letter" });

    // Page layout constants
    const PAGE_WIDTH = 612;
    const PAGE_HEIGHT = 792;
    const MARGIN = 50;
    const LINE_HEIGHT = 14;
    let y = PAGE_HEIGHT - MARGIN; // Start from top (libpdf y=0 is bottom, so we flip)

    // ===== APP HEADER =====
    page.drawText(APP.NAME, {
      x: MARGIN,
      y: y,
      size: 18,
      color: rgb(0, 0, 0),
    });
    y -= 24;

    page.drawText(APP.DESCRIPTION, {
      x: MARGIN,
      y: y,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= LINE_HEIGHT;

    page.drawText(APP.URL, {
      x: MARGIN,
      y: y,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= LINE_HEIGHT;

    y -= LINE_HEIGHT; // Extra space

    // ===== RECEIPT TITLE (right-aligned) =====
    const receipt_label = "Payment Receipt";
    const receipt_label_width = measure_text(receipt_label, 16);
    page.drawText(receipt_label, {
      x: PAGE_WIDTH - MARGIN - receipt_label_width,
      y: y,
      size: 16,
      color: rgb(0, 0, 0),
    });
    y -= 20;

    // ===== DIVIDER LINE =====
    page.drawLine({
      start: { x: MARGIN, y: y },
      end: { x: PAGE_WIDTH - MARGIN, y: y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 30;

    // ===== TRANSACTION DETAILS =====
    page.drawText("Transaction Details", {
      x: MARGIN,
      y: y,
      size: 12,
      color: rgb(0, 0, 0),
    });
    y -= 24;

    // Reference
    page.drawText("Reference:", {
      x: MARGIN,
      y: y,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
    });
    page.drawText(input.transaction.reference, {
      x: MARGIN + 120,
      y: y,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= LINE_HEIGHT + 4;

    // Date
    page.drawText("Date:", {
      x: MARGIN,
      y: y,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
    });
    page.drawText(Format.datetime(input.transaction.createdAt), {
      x: MARGIN + 120,
      y: y,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= LINE_HEIGHT + 4;

    if (input.transaction.plan) {
      // Plan
      page.drawText("Subscription Plan:", {
        x: MARGIN,
        y: y,
        size: 10,
        color: rgb(0.4, 0.4, 0.4),
      });
      page.drawText(input.transaction.plan, {
        x: MARGIN + 120,
        y: y,
        size: 10,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= LINE_HEIGHT + 4;
    }

    // Status
    page.drawText("Status:", {
      x: MARGIN,
      y: y,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
    });
    const status_color =
      input.transaction.status === "success" ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0);
    page.drawText(
      input.transaction.status.charAt(0).toUpperCase() +
        input.transaction.status.slice(1),
      {
        x: MARGIN + 120,
        y: y,
        size: 10,
        color: status_color,
      },
    );
    y -= 30;

    // ===== DIVIDER LINE =====
    page.drawLine({
      start: { x: MARGIN, y: y },
      end: { x: PAGE_WIDTH - MARGIN, y: y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 30;

    // ===== AMOUNT SECTION =====
    // Convert amount from kobo/cents to main currency (divide by 100)
    const amount_value = input.transaction.amount / 100;
    const amount_str = Format.currency(amount_value, {
      currency: input.transaction.currency.toUpperCase(),
    });

    const amount_label = "Amount Paid:";
    const amount_label_width = measure_text(amount_label, 16);
    const amount_width = measure_text(amount_str, 16);

    /**
     * Sized to what it holds rather than pinned at 250pt, which cropped a long
     * amount — the label, a gap, the amount, and padding at each end. Clamped
     * to the content width so a very large figure cannot push the panel past
     * the left margin.
     */
    const PANEL_PADDING = 12;
    const PANEL_GAP = 24;
    const content_width = PAGE_WIDTH - MARGIN * 2;
    const panel_width = Math.min(
      content_width,
      amount_label_width + PANEL_GAP + amount_width + PANEL_PADDING * 2,
    );

    // Background rectangle for emphasis
    page.drawRectangle({
      x: PAGE_WIDTH - MARGIN - panel_width,
      y: y - 6,
      width: panel_width,
      height: 30,
      color: rgb(0.94, 0.94, 0.94),
    });

    page.drawText(amount_label, {
      x: PAGE_WIDTH - MARGIN - amount_width - PANEL_GAP - amount_label_width,
      y: y + 6,
      size: 16,
      color: rgb(0, 0, 0),
    });
    page.drawText(amount_str, {
      x: PAGE_WIDTH - MARGIN - PANEL_PADDING - amount_width,
      y: y + 6,
      size: 16,
      color: rgb(0, 0, 0),
    });
    y -= 50;

    // ===== FOOTER =====
    const footer_y = MARGIN + 40;
    page.drawText("Thank you for your payment!", {
      x: MARGIN,
      y: footer_y + LINE_HEIGHT,
      size: 10,
      color: rgb(0.4, 0.4, 0.4),
    });

    page.drawText(
      "For any questions or concerns, please visit our website or contact support.",
      {
        x: MARGIN,
        y: footer_y,
        size: 9,
        color: rgb(0.4, 0.4, 0.4),
      },
    );

    const pdf_buffer = await doc.save();

    return result.suc({
      buffer: pdf_buffer,
      file_size: pdf_buffer.length,
      content_type: "application/pdf",
      file_name: `${APP.NAME.toLowerCase()}_transaction_${input.transaction.reference}.pdf`,
    });
  } catch (error) {
    Log.error(error, "generate_transaction_pdf.error");
    captureException(error);
    return result.err(ERROR.INTERNAL_SERVER_ERROR);
  }
}
