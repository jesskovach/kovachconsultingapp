import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get LinkedIn access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("linkedin");

    // Fetch profile information
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!profileResponse.ok) {
      throw new Error(`LinkedIn API error: ${profileResponse.status}`);
    }

    const profileData = await profileResponse.json();

    return Response.json({
      profile: {
        name: profileData.name,
        email: profileData.email,
        picture: profileData.picture,
        locale: profileData.locale,
        sub: profileData.sub
      }
    });
  } catch (error) {
    console.error('LinkedIn profile error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});