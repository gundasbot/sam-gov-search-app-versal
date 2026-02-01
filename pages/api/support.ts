import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const { email, message } = req.body

    // TODO: Implement actual support request logic
    // This could involve:
    // - Sending an email
    // - Logging to a database
    // - Integrating with a support ticket system

    console.log('Support Request:', { email, message })

    // Mock success response
    res.status(200).json({ 
      success: true, 
      message: 'Support request received' 
    })
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end('Method Not Allowed')
  }
}