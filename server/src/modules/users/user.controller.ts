import { Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma.js';
import { apiSuccess, apiError } from '../../utils/response.js';
import { AuthRequest } from '../../middleware/auth.js';

export class UserController {
  static async getAddresses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const addresses = await prisma.userAddress.findMany({
        where: { userId: req.user!.userId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });
      return apiSuccess(res, { addresses });
    } catch (error) {
      return next(error);
    }
  }

  static async addAddress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { addressLine, village, district, state, pinCode, landmark, isDefault } = req.body;
      const userId = req.user!.userId;

      if (!addressLine || !village || !district || !pinCode) {
        return apiError(res, 'addressLine, village, district, and pinCode are required', 400);
      }

      // If marked as default, unset other defaults
      if (isDefault) {
        await prisma.userAddress.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const address = await prisma.userAddress.create({
        data: {
          userId,
          addressLine,
          village,
          district,
          state: state || 'Tamil Nadu',
          pinCode,
          landmark,
          isDefault: Boolean(isDefault),
        },
      });

      return apiSuccess(res, { address }, 201);
    } catch (error) {
      return next(error);
    }
  }

  static async deleteAddress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const address = await prisma.userAddress.findFirst({
        where: { id, userId },
      });

      if (!address) {
        return apiError(res, 'Address not found or unauthorized', 404);
      }

      await prisma.userAddress.delete({ where: { id } });
      return apiSuccess(res, { message: 'Address removed successfully' });
    } catch (error) {
      return next(error);
    }
  }
}
