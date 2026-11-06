"""Vẽ ranh giới khu đất lên clip flycam bằng cách bám đặc trưng ảnh (ORB + homography).

Dùng: python3 tools/draw_boundary.py input.mp4 output.mp4
Đa giác nhập tay trên khung đầu (tọa độ ảnh 1600x900), chỉ mang tính minh họa.
"""
import subprocess
import sys

import cv2
import numpy as np

POLY_1600 = [(565, 598), (905, 535), (1145, 512), (1335, 628), (1520, 795), (1480, 838),
             (1265, 790), (1100, 700), (960, 725), (760, 738), (640, 742), (580, 700)]
LABEL = "RANH GIOI DU AN (MINH HOA)"
W, H = 1920, 1080


def main(src, dst):
    cap = cv2.VideoCapture(src)
    fps = cap.get(cv2.CAP_PROP_FPS)
    sx = W / 1600.0
    poly0 = np.array([(x * sx, y * sx) for x, y in POLY_1600], np.float32)
    orb = cv2.ORB_create(4000)
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    ff = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
         "-r", str(fps), "-i", "-", "-i", src, "-map", "0:v", "-map", "1:a?", "-c:v", "libx264",
         "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", dst],
        stdin=subprocess.PIPE)
    prev_kp = prev_des = None
    Hcum = np.eye(3)
    n = 0
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        fr = cv2.resize(fr, (W, H))
        gray = cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY)
        kp, des = orb.detectAndCompute(gray, None)
        if prev_des is not None and des is not None:
            m = bf.match(prev_des, des)
            m = sorted(m, key=lambda x: x.distance)[:800]
            if len(m) >= 12:
                a = np.float32([prev_kp[x.queryIdx].pt for x in m])
                b = np.float32([kp[x.trainIdx].pt for x in m])
                Hs, _ = cv2.findHomography(a, b, cv2.RANSAC, 4.0)
                if Hs is not None:
                    Hcum = Hs @ Hcum
        prev_kp, prev_des = kp, des
        pts = cv2.perspectiveTransform(poly0.reshape(-1, 1, 2), Hcum).reshape(-1, 2).astype(np.int32)
        ov = fr.copy()
        cv2.fillPoly(ov, [pts], (0, 200, 255))
        fr = cv2.addWeighted(ov, 0.22, fr, 0.78, 0)
        cv2.polylines(fr, [pts], True, (0, 200, 255), 5, cv2.LINE_AA)
        c = pts.mean(axis=0).astype(int)
        cv2.putText(fr, LABEL, (int(c[0]) - 260, int(c[1])), cv2.FONT_HERSHEY_SIMPLEX, 1.1,
                    (255, 255, 255), 3, cv2.LINE_AA)
        ff.stdin.write(fr.tobytes())
        n += 1
    ff.stdin.close()
    ff.wait()
    print("frames", n)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
