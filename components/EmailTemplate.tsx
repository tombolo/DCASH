import * as React from 'react';

interface EmailTemplateProps {
  firstName?: string;
  code: string;
}

export function EmailTemplate({ firstName, code }: EmailTemplateProps) {
  const logoUrl = 'https://taskforgein.site/FORGE.png';

  return (
    <div style={{ backgroundColor: '#f8fafc', padding: '24px 0', fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}>
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
        <tbody>
          <tr>
            <td align="center">
              <table width="600" cellPadding={0} cellSpacing={0} role="presentation" style={{ width: '600px', maxWidth: '100%' }}>
                <tbody>
                  <tr>
                    <td align="center" style={{ padding: '8px 16px 0' }}>
                      <img src={logoUrl} width={48} height={34} alt="TaskForge" style={{ display: 'block' }} />
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style={{ padding: '6px 16px 18px', color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>TaskForge</td>
                  </tr>

                  <tr>
                    <td>
                      <table width="100%" role="presentation" cellPadding={0} cellSpacing={0} style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(2,6,23,0.04)', overflow: 'hidden' }}>
                        <tbody>
                          <tr>
                            <td style={{ padding: '28px 28px 8px' }}>
                              <h1 style={{ margin: 0, fontSize: '20px', lineHeight: '28px', color: '#0f172a' }}>
                                Welcome{firstName ? `, ${firstName}` : ''}!
                              </h1>
                              <p style={{ margin: '10px 0 0', fontSize: '14px', lineHeight: '22px', color: '#334155' }}>
                                Use the verification code below to finish creating your TaskForge account.
                              </p>
                            </td>
                          </tr>

                          <tr>
                            <td align="center" style={{ padding: '18px 28px 6px' }}>
                              <div style={{ display: 'inline-block', background: '#1d4ed8', color: '#ffffff', padding: '14px 22px', borderRadius: 10, fontWeight: 800, fontSize: 22, letterSpacing: 4 }}>
                                {code}
                              </div>
                              <div style={{ marginTop: 10, color: '#64748b', fontSize: 12 }}>
                                Expires in 15 minutes
                              </div>
                            </td>
                          </tr>

                          <tr>
                            <td style={{ padding: '12px 28px 24px' }}>
                              <p style={{ margin: 0, fontSize: 12, lineHeight: '18px', color: '#64748b' }}>
                                Didn’t request this? You can safely ignore this email.
                              </p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td align="center" style={{ padding: '18px 8px 0', color: '#94a3b8', fontSize: 12 }}>
                      © {new Date().getFullYear()} TaskForge • <a href="mailto:support@taskforgein.site" style={{ color: '#475569', textDecoration: 'none' }}>support@taskforgein.site</a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
