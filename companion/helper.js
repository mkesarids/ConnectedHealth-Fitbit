// Convert orientation to easily readible metrics
export function quaternionToEuler(quaternion) {
  var q = quaternion;
  
  var t0 = 2.0 * (q.W * q.X + q.Y * q.Z);
  var t1 = 1.0 - 2.0 * (q.X * q.X + q.Y * q.Y);
  var Z = (Math.atan2(t0, t1) * 180/Math.PI).toFixed(2);
  
  var t2 = 2.0 * (q.W * q.Y - q.Z * q.X);
  t2 = t2 > 1.0 ? 1.0 : t2;
  t2 = t2 < -1.0 ? -1.0 : t2;
  var Y = (Math.asin(t2) * 180/Math.PI).toFixed(2);

  var t3 = 2.0 * (q.W * q.Z + q.X * q.Y);
  var t4 = 1.0 - 2.0 * (q.Y * q.Y + q.Z * q.Z);
  var X = (Math.atan2(t3, t4) * 180/Math.PI).toFixed(2);
  
  return {X: X, Y: Y, Z: Z};
}

// Post data to the server
export function postData(url, data) {
  let body = JSON.stringify({data:data});
  fetch(url, {method:"POST", body:body})
    .then(function(response) {
      return response.text();
    }).then(function(text) {
      console.log("Response: " + text); 
    });
}