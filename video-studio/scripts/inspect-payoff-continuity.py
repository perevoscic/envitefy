import cv2,numpy as np,json
p='public/projects/birthday-second-job/payoff.mp4'
c=cv2.VideoCapture(p); frames=[]
while True:
 ok,im=c.read()
 if not ok:break
 frames.append(im)
diffs=[]
for i in range(241,400):
 a=cv2.resize(cv2.cvtColor(frames[i-1],cv2.COLOR_BGR2GRAY),(90,160));b=cv2.resize(cv2.cvtColor(frames[i],cv2.COLOR_BGR2GRAY),(90,160));diffs.append((float(np.abs(a.astype(float)-b).mean()),i))
print('Largest source frame changes',sorted(diffs,reverse=True)[:12])
for i in range(308,315):cv2.imwrite('out/payoff-source-'+str(i)+'.jpg',frames[i])
mask=np.zeros(frames[0].shape[:2],np.uint8);mask[:390,:]=255
sift=cv2.SIFT_create(nfeatures=2000)
k1,d1=sift.detectAndCompute(frames[310],mask);k2,d2=sift.detectAndCompute(frames[311],mask)
m=cv2.BFMatcher().knnMatch(d2,d1,k=2);good=[a for a,b in m if a.distance<0.7*b.distance]
p2=np.float32([k2[a.queryIdx].pt for a in good]);p1=np.float32([k1[a.trainIdx].pt for a in good]);mat,inliers=cv2.estimateAffinePartial2D(p2,p1,method=cv2.RANSAC,ransacReprojThreshold=3)
print('Post to pre affine',mat.tolist(),'inliers',int(inliers.sum()),'matches',len(good))
cv2.imwrite('out/payoff-alignment-preview.jpg',np.concatenate([frames[310],cv2.warpAffine(frames[311],mat,(720,1280))],axis=1))
json.dump({'matrix':mat.tolist(),'inliers':int(inliers.sum()),'matches':len(good)},open('projects/birthday-second-job/payoff-alignment-v4.json','w'),indent=2)
