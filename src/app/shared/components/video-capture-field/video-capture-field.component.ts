import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild, inject, input, output } from '@angular/core';

/**
 * Reusable in-browser video capture control (getUserMedia + MediaRecorder), generalized from the
 * single hardcoded "Caltos Verify" video-confirmation step in apply.component.ts so any document
 * that specifies captureMethod: 'in_app_recording' (see ApplicantProfile.requiredDocuments in
 * products.service.ts) can have its own independent recording instance.
 */
@Component({
  selector: 'app-video-capture-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './video-capture-field.component.html',
  styleUrl: './video-capture-field.component.scss',
})
export class VideoCaptureFieldComponent implements OnDestroy {
  label = input('Video recording');
  prompt = input('Record a short video confirming this information. Takes less than a minute.');
  /** Data URL of the recorded video, or null if nothing recorded yet. */
  value = input<string | null>(null);
  valueChange = output<string | null>();

  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('videoPreview') videoPreviewRef?: ElementRef<HTMLVideoElement>;

  cameraStream: MediaStream | null = null;
  cameraError: string | null = null;
  isRecording = false;
  recordedChunks: Blob[] = [];
  mediaRecorder: MediaRecorder | null = null;
  videoPlaybackUrl: string | null = null;
  checkingVideo = false;

  async startCamera() {
    this.cameraError = null;
    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (this.videoPreviewRef) {
        this.videoPreviewRef.nativeElement.srcObject = this.cameraStream;
      }
    } catch {
      this.cameraError = 'Camera and microphone access is needed to record this — please allow access and try again.';
    }
  }

  startRecording() {
    if (!this.cameraStream) return;
    this.recordedChunks = [];
    const recorder = new MediaRecorder(this.cameraStream);
    recorder.ondataavailable = (e) => { if (e.data.size > 0) this.recordedChunks.push(e.data); };
    recorder.onstop = () => this.onRecordingStopped();
    recorder.start();
    this.mediaRecorder = recorder;
    this.isRecording = true;
  }

  stopRecording() {
    this.mediaRecorder?.stop();
    this.isRecording = false;
    this.checkingVideo = true;
  }

  private onRecordingStopped() {
    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    if (this.videoPlaybackUrl) URL.revokeObjectURL(this.videoPlaybackUrl);
    this.videoPlaybackUrl = URL.createObjectURL(blob);
    this.stopCameraTracks();

    const reader = new FileReader();
    reader.onload = () => {
      this.checkingVideo = false;
      this.valueChange.emit(reader.result as string);
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(blob);
  }

  retakeVideo() {
    if (this.videoPlaybackUrl) URL.revokeObjectURL(this.videoPlaybackUrl);
    this.videoPlaybackUrl = null;
    this.checkingVideo = false;
    this.recordedChunks = [];
    this.valueChange.emit(null);
    this.startCamera();
  }

  private stopCameraTracks() {
    this.cameraStream?.getTracks().forEach((t) => t.stop());
    this.cameraStream = null;
  }

  ngOnDestroy() {
    this.stopCameraTracks();
    if (this.videoPlaybackUrl) URL.revokeObjectURL(this.videoPlaybackUrl);
  }
}
