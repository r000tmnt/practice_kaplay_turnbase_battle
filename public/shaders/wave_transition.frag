precision mediump float;

uniform float u_time;

vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    float progress = u_time * 0.5;

    // Width of the mask band (0.3 = ~30% of screen width)
    float bandWidth = 1.0;

    // Jagged shape (random noise via sin)
    float bands = 20.0;
    float band = floor(uv.y * bands);
    float bandOffset = mod(band, 2.0) * 0.05;
    float jag = sin(uv.y * 100.0 + progress * 10.0) * 0.02;

    // Moving window edges
    float head = 1.5 - progress + bandOffset + jag; // right jagged edge
    float tail = head - bandWidth;                  // left jagged edge

    // Inside the band: draw black
    if (uv.x > tail && uv.x < head) {
        return vec4(0.0, 0.0, 0.0, 1.0);
    }

    // Else: fully transparent
    return vec4(0.0, 0.0, 0.0, 0.0);
}