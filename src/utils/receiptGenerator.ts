import { OrderItem } from '../types.ts';

export interface OrderReceiptData {
  id: string;
  createdAt: string;
  status?: string;
  customerName: string;
  customerPhone: string;
  alternatePhone?: string;
  customerEmail?: string;
  cnic?: string;
  shippingAddress: string;
  areaLandmark?: string;
  city: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  paymentDetail?: string;
  notes?: string;
  showroomPhone?: string;
  showroomEmail?: string;
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const clean = String(text || '').trim();
  if (!clean) return ['—'];
  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      if (ctx.measureText(word).width > maxWidth) {
        let chunk = '';
        for (const ch of word) {
          if (ctx.measureText(chunk + ch).width <= maxWidth) {
            chunk += ch;
          } else {
            if (chunk) lines.push(chunk);
            chunk = ch;
          }
        }
        current = chunk;
      } else {
        current = word;
      }
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : ['—'];
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function formatReceiptDateTime(isoString: string): string {
  const d = isoString ? new Date(isoString) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toLocaleString('en-PK');
  return d.toLocaleString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export async function downloadOrderReceiptPng(
  data: OrderReceiptData
): Promise<{ ok: boolean; filename: string }> {
  const filename = `VoltGlide-Receipt-${data.id}.png`;

  try {
    const width = 900;
    const outerPad = 40;
    const cardX = outerPad;
    const cardW = width - outerPad * 2;
    const innerPad = 48;
    const contentX = cardX + innerPad;
    const contentW = cardW - innerPad * 2;
    const valueMaxW = contentW * 0.58;

    // Measurement context
    const measureCanvas = document.createElement('canvas');
    const mCtx = measureCanvas.getContext('2d');
    if (!mCtx) return { ok: false, filename };

    const formattedDate = formatReceiptDateTime(data.createdAt);
    const fullAddress = `${data.shippingAddress}${
      data.areaLandmark ? ` (${data.areaLandmark})` : ''
    }, ${data.city}, Pakistan`;

    interface DetailRow {
      label: string;
      lines: string[];
      accent?: boolean;
      mono?: boolean;
    }

    mCtx.font = '600 22px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    const rawRows: { label: string; value: string; accent?: boolean; mono?: boolean }[] = [
      { label: 'Receipt / Order #', value: `#${data.id}`, accent: true, mono: true },
      { label: 'Date & Time', value: formattedDate },
      { label: 'Payment Method', value: data.paymentMethod, accent: true },
      ...(data.paymentDetail
        ? [{ label: 'Account / TID Ref', value: data.paymentDetail, mono: true }]
        : []),
      { label: 'Customer Name', value: data.customerName },
      {
        label: 'Mobile Number',
        value: data.alternatePhone
          ? `${data.customerPhone} / ${data.alternatePhone}`
          : data.customerPhone,
        mono: true
      },
      ...(data.cnic ? [{ label: 'CNIC (Warranty)', value: data.cnic, mono: true }] : []),
      { label: 'Delivery Address', value: fullAddress }
    ];

    const detailRows: DetailRow[] = rawRows.map((row) => ({
      label: row.label,
      lines: wrapCanvasText(mCtx, row.value, valueMaxW),
      accent: row.accent,
      mono: row.mono
    }));

    const lineHeight = 30;
    const rowGap = 18;
    const detailsHeight = detailRows.reduce(
      (sum, row) => sum + Math.max(1, row.lines.length) * lineHeight + rowGap,
      0
    );

    const safeItems =
      Array.isArray(data.items) && data.items.length > 0
        ? data.items
        : [
            {
              productId: 'order-total',
              productName: 'VoltGlide Scooty Order',
              price: data.totalAmount,
              quantity: 1,
              image: ''
            }
          ];

    mCtx.font = '700 22px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    const measuredItems = safeItems.map((item) => {
      const nameLines = wrapCanvasText(mCtx, item.productName, contentW - 220);
      return {
        ...item,
        nameLines
      };
    });

    const itemsBoxInnerPad = 24;
    const itemsListHeight = measuredItems.reduce(
      (sum, it) => sum + it.nameLines.length * 28 + 38 + 14,
      0
    );
    const itemsBoxHeight = 58 + itemsListHeight + itemsBoxInnerPad;

    mCtx.font = '500 20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    const notesLines = data.notes
      ? wrapCanvasText(mCtx, `Note: ${data.notes}`, contentW - 36)
      : [];
    const notesHeight = notesLines.length > 0 ? notesLines.length * 26 + 34 : 0;

    const topBannerH = 148;
    const heroBlockH = 216;
    const dividerBlockH = 56;
    const footerBlockH = 150;

    const cardH =
      topBannerH +
      heroBlockH +
      dividerBlockH +
      detailsHeight +
      22 +
      itemsBoxHeight +
      (notesHeight > 0 ? notesHeight + 18 : 0) +
      dividerBlockH +
      footerBlockH;

    const totalHeight = outerPad * 2 + cardH;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { ok: false, filename };

    // Outer background (deep slate)
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, totalHeight);

    // Main white e-receipt card
    ctx.save();
    drawRoundedRect(ctx, cardX, outerPad, cardW, cardH, 32);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.clip();

    // Top branded header gradient inside card
    const headerGrad = ctx.createLinearGradient(cardX, outerPad, cardX + cardW, outerPad + topBannerH);
    headerGrad.addColorStop(0, '#042f2e');
    headerGrad.addColorStop(0.55, '#0f172a');
    headerGrad.addColorStop(1, '#083344');
    ctx.fillStyle = headerGrad;
    ctx.fillRect(cardX, outerPad, cardW, topBannerH);

    // Header brand text
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 32px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('VOLT', contentX, outerPad + 64);
    const voltW = ctx.measureText('VOLT').width;
    ctx.fillStyle = '#22d3ee';
    ctx.fillText('GLIDE', contentX + voltW, outerPad + 64);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('MOTORS PAKISTAN · OFFICIAL E-RECEIPT', contentX, outerPad + 96);

    // Right badge in banner
    ctx.textAlign = 'right';
    ctx.fillStyle = '#34d399';
    ctx.font = '700 18px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('VERIFIED SLIP', cardX + cardW - innerPad, outerPad + 62);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 16px monospace';
    ctx.fillText(`#${data.id}`, cardX + cardW - innerPad, outerPad + 92);

    ctx.restore();

    // Verified checkmark circle centered below banner
    let y = outerPad + topBannerH;
    const badgeCenterY = y + 44;
    ctx.beginPath();
    ctx.arc(width / 2, badgeCenterY, 34, 0, Math.PI * 2);
    ctx.fillStyle = '#ecfdf5';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#10b981';
    ctx.stroke();

    // Checkmark stroke
    ctx.beginPath();
    ctx.moveTo(width / 2 - 14, badgeCenterY + 1);
    ctx.lineTo(width / 2 - 4, badgeCenterY + 11);
    ctx.lineTo(width / 2 + 15, badgeCenterY - 10);
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#059669';
    ctx.stroke();

    // Status subtitle + Hero Total Amount
    ctx.textAlign = 'center';
    ctx.fillStyle = '#059669';
    ctx.font = '700 18px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    const statusText = (data.status || 'Order Booked').toUpperCase();
    ctx.fillText(`${statusText} · PAYMENT & ORDER RECEIPT`, width / 2, y + 108);

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 54px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(`PKR ${Number(data.totalAmount || 0).toLocaleString()}`, width / 2, y + 168);

    ctx.fillStyle = '#64748b';
    ctx.font = '600 18px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(
      data.paymentMethod === 'Cash on Delivery'
        ? 'Payable at Doorstep Delivery (Cash on Delivery)'
        : `Selected Channel: ${data.paymentMethod}`,
      width / 2,
      y + 200
    );

    y += heroBlockH;

    // Perforated dashed ticket divider with semicircular cutouts
    const drawPerforatedDivider = (divY: number) => {
      const lineY = divY + dividerBlockH / 2;
      ctx.save();
      ctx.setLineDash([10, 10]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(cardX + 26, lineY);
      ctx.lineTo(cardX + cardW - 26, lineY);
      ctx.stroke();
      ctx.restore();

      // Left & right notches matching outer background
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(cardX, lineY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cardX + cardW, lineY, 18, 0, Math.PI * 2);
      ctx.fill();
    };

    drawPerforatedDivider(y);
    y += dividerBlockH;

    // Key-Value Receipt Rows
    for (const row of detailRows) {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748b';
      ctx.font = '600 20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(row.label, contentX, y + 22);

      ctx.textAlign = 'right';
      ctx.fillStyle = row.accent ? '#0284c7' : '#0f172a';
      ctx.font = row.mono
        ? '700 20px monospace'
        : '700 20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

      row.lines.forEach((line, idx) => {
        ctx.fillText(line, cardX + cardW - innerPad, y + 22 + idx * lineHeight);
      });

      y += Math.max(1, row.lines.length) * lineHeight + rowGap;
    }

    y += 14;

    // Itemized Scooties Container
    ctx.save();
    drawRoundedRect(ctx, contentX, y, contentW, itemsBoxHeight, 20);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#475569';
    ctx.font = '800 17px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('ORDERED SCOOTIES SUMMARY', contentX + 24, y + 36);

    ctx.beginPath();
    ctx.moveTo(contentX + 24, y + 52);
    ctx.lineTo(contentX + contentW - 24, y + 52);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    let itemY = y + 78;
    for (const item of measuredItems) {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 21px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      item.nameLines.forEach((line, idx) => {
        ctx.fillText(line, contentX + 24, itemY + idx * 28);
      });

      ctx.textAlign = 'right';
      ctx.fillStyle = '#0f172a';
      ctx.font = '800 21px monospace';
      ctx.fillText(
        `PKR ${(item.price * item.quantity).toLocaleString()}`,
        contentX + contentW - 24,
        itemY
      );

      const subTextY = itemY + item.nameLines.length * 28;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748b';
      ctx.font = '600 17px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(
        `Qty: ${item.quantity} × PKR ${item.price.toLocaleString()}${
          item.selectedColor ? ` · Color: ${item.selectedColor}` : ''
        }`,
        contentX + 24,
        subTextY
      );

      itemY += item.nameLines.length * 28 + 38 + 14;
    }

    y += itemsBoxHeight;

    // Optional Notes box
    if (notesHeight > 0) {
      y += 18;
      ctx.save();
      drawRoundedRect(ctx, contentX, y, contentW, notesHeight, 16);
      ctx.fillStyle = '#fffbeb';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#fde68a';
      ctx.stroke();
      ctx.restore();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#92400e';
      ctx.font = '600 18px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      notesLines.forEach((line, idx) => {
        ctx.fillText(line, contentX + 18, y + 32 + idx * 26);
      });
      y += notesHeight;
    }

    drawPerforatedDivider(y);
    y += dividerBlockH;

    // Official Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 20px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Thank you for choosing VoltGlide Motors Pakistan!', width / 2, y + 26);

    ctx.fillStyle = '#475569';
    ctx.font = '600 17px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    const supportPhone = data.showroomPhone || '0321-0424424';
    const supportEmail = data.showroomEmail || 'sales@voltglide.com';
    ctx.fillText(`Helpline: ${supportPhone} · Email: ${supportEmail}`, width / 2, y + 60);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 15px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(
      'Official Digital Order & Payment Receipt · Save this slip for warranty & dispatch support',
      width / 2,
      y + 92
    );

    // Download via Blob or DataURL fallback
    const triggerAnchorDownload = (url: string, revokeAfter?: boolean) => {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (revokeAfter) {
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }
    };

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png')
    );

    if (blob) {
      const objectUrl = URL.createObjectURL(blob);
      triggerAnchorDownload(objectUrl, true);
      return { ok: true, filename };
    }

    const dataUrl = canvas.toDataURL('image/png');
    triggerAnchorDownload(dataUrl, false);
    return { ok: true, filename };
  } catch (err) {
    console.error('Failed to generate PNG receipt:', err);
    return { ok: false, filename };
  }
}
