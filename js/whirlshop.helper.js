


function normalize (points, numSides, cclockwise){
	var cx = 0,
	cy = 0,
	i,
	j, 
	temp;

	// Find the center
	for (i = 0; i < numSides; i++) {
		cx += points[i].x / numSides;
		cy += points[i].y / numSides;
	}
	// Sort points clockwise or counter-clockwise
	for (i = 0; i < numSides; i++) {
		for (j = i + 1; j < numSides; j++) {
			if (cclockwise ^ less(points[i], points[j], cx, cy)) {
				var temp = points[i];
				points[i] = points[j];
				points[j] = temp;
			}
		}
	}
}

// From stackoverflow
function less(a, b, cx, cy) {
    if (a.x - cx >= 0 && b.x - cx < 0)
        return true;
    if (a.x - cx < 0 && b.x - cx >= 0)
        return false;
    if (a.x - cx == 0 && b.x - cx == 0) {
        if (a.y - cy >= 0 || b.y - cy >= 0)
            return a.y > b.y;
        return b.y > a.y;
    }

    // Compute the cross product of vectors (center -> a) x (center -> b)
    var det = (a.x - cx) * (b.y - cy) - (b.x - cx) * (a.y - cy);
    if (det < 0)
        return true;
    if (det > 0)
        return false;

    // Points a and b are on the same line from the center
    // Check which point is closer to the center
    var d1 = (a.x - cx) * (a.x - cx) + (a.y - cy) * (a.y - cy);
    var d2 = (b.x - cx) * (b.x - cx) + (b.y - cy) * (b.y - cy);
    return d1 > d2;
}

function shapeIsConvex(points){
    var got_negative = false,
    got_positive = false,
    cross_prodcut = 0,
    num_points = points.length,
    A,
    B,
    C;
    for (A = 0; A < num_points; A++)
    {
        B = (A + 1) % num_points;
        C = (B + 1) % num_points;
		cross_product =
            CrossProductLength(
                points[A].x, points[A].y,
                points[B].x, points[B].y,
                points[C].x, points[C].y);
        if (cross_product < 0)
        {
            got_negative = true;
        }
        else if (cross_product > 0)
        {
            got_positive = true;
        }
        if (got_negative && got_positive) return false;
    }
    // If we got this far, the polygon is convex.
    return true;
}

function CrossProductLength(Ax, Ay, Bx, By, Cx, Cy)
{
    // Get the vectors' coordinates.
    var BAx = Ax - Bx,
    BAy = Ay - By,
    BCx = Cx - Bx,
    BCy = Cy - By;

    // Calculate the Z coordinate of the cross product.
    return (BAx * BCy - BAy * BCx);
}