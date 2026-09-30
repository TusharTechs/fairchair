// Error taxonomy for YouCam calls. `code` is either one of our transport
// codes or the engine error code YouCam returned (e.g. "error_no_face").

export type YouCamErrorCode =
  | "auth_failed"
  | "rate_limited"
  | "timeout"
  | "request_failed"
  | "malformed_response"
  | "task_failed"
  | "task_expired"
  | (string & {});

export class YouCamError extends Error {
  readonly code: YouCamErrorCode;
  readonly status?: number;
  readonly retryable: boolean;

  constructor(opts: { code: YouCamErrorCode; message: string; status?: number; retryable?: boolean }) {
    super(opts.message);
    this.name = "YouCamError";
    this.code = opts.code;
    this.status = opts.status;
    this.retryable = opts.retryable ?? false;
  }
}

// What we tell a client when YouCam rejects their photo. Keyed by the engine
// error codes documented for the hair and skin-tone endpoints.
const GUIDANCE: Record<string, string> = {
  error_no_face: "We couldn't find a face. Keep your whole face in the frame — length is measured from it.",
  error_face_position_invalid: "Part of your face is cut off. Step back so your full face and shoulders are visible.",
  error_multiple_people: "Only one person in the photo, please.",
  error_pose: "Face the camera straight on, chin level.",
  error_large_face_angle: "Face the camera straight on, chin level.",
  error_face_parsing: "We couldn't read your hair outline. Try a plain background and even light.",
  error_below_min_image_size: "That photo is too small. Use your phone's main camera.",
  exceed_max_filesize: "That photo is too large. Try again — we'll resize it for you.",
  error_nsfw_content_detected: "That photo couldn't be processed. Please use a different one.",
  error_decode_image: "That file isn't a photo we can read. Use a JPG or PNG.",
  error_no_shoulder: "Include your shoulders so the preview can place the hair.",
  error_hair_too_short: "The preview needs a little more natural length to work with.",
  error_bald_image: "The preview needs visible hair to work with.",
  error_face_angle_invalid: "The angle wasn't quite right. Turn your head (don't tilt it), or for the last photo lower your chin so your hairline faces the camera.",
  error_face_position_too_small: "Move a little closer — your face should fill about half the width of the photo.",
  error_face_position_out_of_boundary: "Move back a little so your whole face and hair fit in the frame.",
  error_insufficient_lighting: "It's too dark. Face a window or a light.",
  error_mismatch_image_size: "Your photos came out different sizes. Take them again with the same camera.",
  missing_view: "That photo was skipped, so this wasn't measured.",
  not_recorded: "This wasn't recorded for the demo client.",
};

export function guidanceFor(code: string | undefined): string {
  return (code && GUIDANCE[code]) || "Something went wrong reading that photo. Try again in good light, facing the camera.";
}
