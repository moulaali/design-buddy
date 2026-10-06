export function softShadow(c, blur, offsetY, alpha) {
    const k = c.getTransform().a;
    c.shadowColor = `rgba(15, 23, 42, ${alpha})`;
    c.shadowBlur = blur * k;
    c.shadowOffsetX = 0;
    c.shadowOffsetY = offsetY * k;
}

export function fillCard(c, s) {
    if (s.fill) {
        c.fillStyle = s.fill;
    } else {
        const grad = c.createLinearGradient(0, s.y, 0, s.y + s.h);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, '#f8fafc');
        c.fillStyle = grad;
    }
    softShadow(c, 28, 12, 0.08);
    c.fill();
    softShadow(c, 4, 1, 0.08);
    c.fill();
    c.shadowColor = 'transparent';
    c.lineWidth = 1;
    c.strokeStyle = 'rgba(15, 23, 42, 0.10)';
    c.stroke();
}
