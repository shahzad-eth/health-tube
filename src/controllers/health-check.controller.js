import { asyncHandler } from "../utlils/async-handler.js"
import { ApiResponse } from "../utlils/api-response.js"

const healthCheck = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Healthy")
        )
})

export { healthCheck }